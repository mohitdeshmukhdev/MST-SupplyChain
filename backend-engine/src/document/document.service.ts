import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { ethers } from 'ethers';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async attachDocument(batchId: string, docType: string, ipfsCid: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found in off-chain database");

    // The content hash is a keccak256 of the CID for simplicity, 
    // though in production you'd hash the actual document binary.
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));

    const contract = this.blockchain.getContract('DocumentRegistry');
    
    // DocumentRegistry ABI -> attachDocument(uint256 batchId, string calldata ipfsCid, string calldata documentType)
    try {
      const tx = await contract.attachDocument(
        batch.blockchainId,
        ipfsCid,
        docType
      );

      const document = await this.prisma.document.create({
        data: {
          batchId: batch.id,
          docType,
          ipfsCid,
          contentHash,
          authoritySigner: this.blockchain.relayerWallet.address,
          txHash: tx.hash
        }
      });

      await this.txLogger.logTransaction(
        tx.hash,
        'DocumentRegistry',
        'attachDocument',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { blockchainId: batch.blockchainId, ipfsCid, docType }
      );

      return { document, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to execute contract: ${error.message}`);
    }
  }
}
