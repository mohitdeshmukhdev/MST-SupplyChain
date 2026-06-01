import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async registerIdentity(walletAddress: string, legalName: string, entityType: string, kycDocCid: string) {
    // 1. Create or update off-chain record
    const identity = await this.prisma.identity.upsert({
      where: { walletAddress },
      update: {
        legalName,
        entityType,
        kycDocCid,
        isVerified: true,
        verifiedBy: this.blockchain.relayerWallet.address
      },
      create: {
        walletAddress,
        legalName,
        entityType,
        kycDocCid,
        isVerified: true,
        verifiedBy: this.blockchain.relayerWallet.address
      }
    });

    // 2. Call IdentityRegistry on-chain (verifyIdentity is the correct method name)
    const contract = this.blockchain.getContract('IdentityRegistry');
    
    try {
      const taxId = "TAX-" + walletAddress.substring(2, 8).toUpperCase();
      const jurisdiction = "Global";
      const tx = await contract.verifyIdentity(walletAddress, legalName, taxId, jurisdiction, entityType);
      
      // 3. Log transaction
      await this.txLogger.logTransaction(
        tx.hash,
        'IdentityRegistry',
        'verifyIdentity',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { walletAddress, legalName, taxId, jurisdiction, primaryRole: entityType }
      );

      // Update off-chain tx hash
      await this.prisma.identity.update({
        where: { id: identity.id },
        data: { onChainTxHash: tx.hash }
      });

      return { identity, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to execute contract: ${error.message}`);
    }
  }

  async verifyIdentity(walletAddress: string) {
    // 1. Fetch off-chain details to get registration arguments
    const identityDb = await this.prisma.identity.findUnique({
      where: { walletAddress }
    });
    if (!identityDb) {
      throw new Error(`Identity not found for wallet: ${walletAddress}`);
    }

    // 2. Call on-chain
    const contract = this.blockchain.getContract('IdentityRegistry');
    try {
      const taxId = "TAX-" + walletAddress.substring(2, 8).toUpperCase();
      const jurisdiction = "Global";
      const tx = await contract.verifyIdentity(
        walletAddress,
        identityDb.legalName,
        taxId,
        jurisdiction,
        identityDb.entityType
      );
      
      await this.txLogger.logTransaction(
        tx.hash,
        'IdentityRegistry',
        'verifyIdentity',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { walletAddress, legalName: identityDb.legalName, taxId, jurisdiction, primaryRole: identityDb.entityType }
      );

      // 3. Update off-chain
      const identity = await this.prisma.identity.update({
        where: { walletAddress },
        data: { 
          isVerified: true,
          verifiedBy: this.blockchain.relayerWallet.address,
          onChainTxHash: tx.hash
        }
      });

      return { identity, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to verify: ${error.message}`);
    }
  }

  async getIdentity(walletAddress: string) {
    return this.prisma.identity.findUnique({
      where: { walletAddress }
    });
  }
}
