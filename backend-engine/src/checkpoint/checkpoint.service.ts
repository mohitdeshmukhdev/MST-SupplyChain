import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { BatchStage } from '@prisma/client';

@Injectable()
export class CheckpointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async logCheckpoint(
    batchId: string, 
    fromAddress: string, 
    toAddress: string, 
    location: string, 
    gpsLat?: number, 
    gpsLng?: number,
    newStage: BatchStage = BatchStage.IN_TRANSIT
  ) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    const contract = this.blockchain.getContract('BatchRegistry');

    try {
      // We log custody transfer on-chain if toAddress is provided
      let txHash = "pending_hash";
      if (toAddress && toAddress !== batch.currentCustodianId) {
          const tx = await contract.transferCustody(batch.blockchainId, toAddress);
          txHash = tx.hash;
          
          await this.txLogger.logTransaction(
            tx.hash,
            'BatchRegistry',
            'transferCustody',
            this.blockchain.relayerWallet.address,
            await contract.getAddress(),
            { batchId: batch.blockchainId, newCustodian: toAddress }
          );
      } else {
          // If just updating stage without custody transfer
          const txStage = await contract.updateStage(batch.blockchainId, this.mapStageToOnChain(newStage));
          txHash = txStage.hash;
          
          await this.txLogger.logTransaction(
            txHash,
            'BatchRegistry',
            'updateStage',
            this.blockchain.relayerWallet.address,
            await contract.getAddress(),
            { batchId: batch.blockchainId, stage: newStage }
          );
      }

      // Update Prisma
      const checkpoint = await this.prisma.checkpoint.create({
        data: {
          batchId: batch.id,
          fromAddress,
          toAddress,
          location,
          stage: newStage,
          gpsLat,
          gpsLng,
          txHash,
        }
      });

      // Update Batch current stage
      await this.prisma.batch.update({
        where: { id: batch.id },
        data: { 
          stage: newStage,
          ...(toAddress ? { currentCustodianId: toAddress } : {})
        }
      });

      return checkpoint;
    } catch (error: any) {
      throw new Error(`Failed to log checkpoint: ${error.message}`);
    }
  }

  private mapStageToOnChain(stage: BatchStage): number {
    const stageMap: Record<BatchStage, number> = {
      MINTED: 0,
      DISPATCHED: 1,
      IN_TRANSIT: 2,
      CUSTOMS_CLEARED: 3,
      RETAIL_READY: 4,
      DISPUTED: 5
    };
    return stageMap[stage];
  }
}
