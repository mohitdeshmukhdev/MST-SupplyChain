import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { DEFRA_FACTORS } from '../config/evm.config';
import { VehicleType } from '@prisma/client';

@Processor('carbon-queue')
export class CarbonProcessor extends WorkerHost {
  private readonly logger = new Logger(CarbonProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ pipeline task Job ID: ${job.id}`);
    
    const { batchId, vehicleType, distanceKm } = job.data;

    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      this.logger.error(`Batch ${batchId} not found in DB`);
      throw new Error(`Batch ${batchId} not found`);
    }

    const weightTonnes = batch.weightTonnes || 1; 

    // Execute DEFRA math
    const factor = DEFRA_FACTORS[vehicleType] || DEFRA_FACTORS['DIESEL_TRUCK_HGV'];
    const computedEmissionsKg = Math.round(distanceKm * weightTonnes * factor);

    this.logger.debug(`DEFRA Math complete: ${distanceKm}km x ${weightTonnes}t x ${factor} = ${computedEmissionsKg}kg CO₂`);

    const contract = this.blockchain.getContract('CarbonRegistry');

    try {
      this.logger.log(`Submitting emissions data to CarbonRegistry contract...`);

      // CarbonRegistry ABI -> logEmissions(uint256 batchId, uint256 distanceKm, uint256 emissionsKg, string calldata vehicleType)
      const tx = await contract.logEmissions(
        batch.blockchainId,
        Math.floor(distanceKm),
        computedEmissionsKg,
        vehicleType
      );

      // Save to off-chain DB
      const carbonLogCount = await this.prisma.carbonLog.count({ where: { batchId: batch.id } });
      await this.prisma.carbonLog.create({
        data: {
          batchId: batch.id,
          legIndex: carbonLogCount,
          fromLocation: "Simulated Start", // Mock data for demo
          toLocation: "Simulated End",
          distanceKm,
          weightTonnes,
          vehicleType: vehicleType as VehicleType,
          transporterAddress: this.blockchain.relayerWallet.address,
          emissionFactor: factor,
          emissionsKg: computedEmissionsKg,
          txHash: tx.hash
        }
      });

      await this.txLogger.logTransaction(
        tx.hash,
        'CarbonRegistry',
        'logEmissions',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { blockchainId: batch.blockchainId, distanceKm, computedEmissionsKg, vehicleType }
      );

      this.logger.log(`✓ Automated on-chain carbon accounting entry established. Tx: ${tx.hash}`);
      return { success: true, emissions: computedEmissionsKg, txHash: tx.hash };
    } catch (contractWriteError) {
      this.logger.error(`Failed to record emissions metrics to MST network:`, contractWriteError);
      throw contractWriteError;
    }
  }
}
