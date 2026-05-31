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
    // 1. Create off-chain record
    const identity = await this.prisma.identity.create({
      data: {
        walletAddress,
        legalName,
        entityType,
        kycDocCid,
        isVerified: false
      }
    });

    // 2. Call IdentityRegistry on-chain
    const contract = this.blockchain.getContract('IdentityRegistry');
    
    // IdentityRegistry.sol ABI -> registerIdentity(address _wallet, string _legalName, string _entityType, string _kycDocCid)
    try {
      const tx = await contract.registerIdentity(walletAddress, legalName, entityType, kycDocCid);
      
      // 3. Log transaction
      await this.txLogger.logTransaction(
        tx.hash,
        'IdentityRegistry',
        'registerIdentity',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { walletAddress, legalName, entityType, kycDocCid }
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
    // 1. Call on-chain
    const contract = this.blockchain.getContract('IdentityRegistry');
    try {
      const tx = await contract.verifyIdentity(walletAddress);
      
      await this.txLogger.logTransaction(
        tx.hash,
        'IdentityRegistry',
        'verifyIdentity',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { walletAddress }
      );

      // 2. Update off-chain
      const identity = await this.prisma.identity.update({
        where: { walletAddress },
        data: { 
          isVerified: true,
          verifiedBy: this.blockchain.relayerWallet.address
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
