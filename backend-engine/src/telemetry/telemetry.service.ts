import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { ethers } from 'ethers';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async anchorTelemetry(
    batchId: string,
    temperatureC: number,
    humidityPct: number,
    gpsLat: number,
    gpsLng: number,
    isBreached: boolean,
    breachReason: string
  ) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    // 1. Create a data string and hash it (keccak256)
    const rawDataString = `${temperatureC},${humidityPct},${gpsLat},${gpsLng}`;
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(rawDataString));

    // 2. Call TelemetryRegistry on-chain
    const contract = this.blockchain.getContract('TelemetryRegistry');
    
    // anchorTelemetry(uint256 batchId, bytes32 dataHash, bool isBreached, string calldata breachReason)
    try {
      const tx = await contract.anchorTelemetry(
        batch.blockchainId, 
        dataHash, 
        isBreached, 
        breachReason || ""
      );

      // 3. Create off-chain record linking the raw data to the on-chain hash
      const telemetry = await this.prisma.telemetryAnchor.create({
        data: {
          batchId: batch.id,
          temperatureC,
          humidityPct,
          gpsLat,
          gpsLng,
          dataHash,
          complianceBreach: isBreached,
          breachReason,
          submitterAddress: this.blockchain.relayerWallet.address,
          txHash: tx.hash
        }
      });

      // 4. Log transaction
      await this.txLogger.logTransaction(
        tx.hash,
        'TelemetryRegistry',
        'anchorTelemetry',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { blockchainId: batch.blockchainId, dataHash, isBreached, breachReason }
      );

      return { telemetry, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to execute contract: ${error.message}`);
    }
  }
}
