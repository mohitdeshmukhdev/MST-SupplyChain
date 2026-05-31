import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { BatchStage } from '@prisma/client';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async mintBatch(
    gtin: string, 
    productName: string, 
    originFacility: string, 
    quantity: number, 
    unit: string, 
    weightTonnes: number, 
    manufacturerWallet: string
  ) {
    const contract = this.blockchain.getContract('BatchRegistry');
    
    try {
      const manufacturer = await this.prisma.identity.findUnique({
        where: { walletAddress: manufacturerWallet }
      });
      if (!manufacturer) throw new Error("Manufacturer not found in off-chain database");

      const tx = await contract.mintBatch(gtin, originFacility, quantity, unit);
      const receipt = await this.blockchain.provider.waitForTransaction(tx.hash, 1);
      
      if (!receipt) throw new Error("Transaction receipt not found");

      let blockchainBatchId = 0;
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsedLog && parsedLog.name === 'BatchMinted') {
            blockchainBatchId = Number(parsedLog.args[0]);
          }
        } catch(e) { }
      }

      if (blockchainBatchId === 0) {
        // Fallback: If parsing fails, just get the next ID from contract manually (not ideal for high concurrency)
        blockchainBatchId = Number(await contract.nextBatchId()) - 1;
      }

      const batch = await this.prisma.batch.create({
        data: {
          blockchainId: blockchainBatchId,
          gtin,
          productName,
          originFacility,
          quantity,
          unit,
          weightTonnes,
          manufacturerId: manufacturer.id,
          currentCustodianId: manufacturer.id,
          stage: BatchStage.MINTED,
          mintTxHash: tx.hash,
          mintedAt: new Date()
        }
      });

      await this.txLogger.logTransaction(
        tx.hash,
        'BatchRegistry',
        'mintBatch',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { gtin, originFacility, quantity, unit }
      );

      return { batch, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to execute mintBatch: ${error.message}`);
    }
  }

  async getBatch(id: string) {
    return this.prisma.batch.findUnique({
      where: { id },
      include: {
        checkpoints: true,
        telemetryAnchors: true,
        documents: true,
        escrow: true,
        carbonLogs: true
      }
    });
  }

  async getAllBatches() {
    return this.prisma.batch.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}
