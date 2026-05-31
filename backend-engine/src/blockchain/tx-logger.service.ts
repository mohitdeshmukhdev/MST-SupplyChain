import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from './blockchain.service';
import { TxStatus } from '@prisma/client';

@Injectable()
export class TxLoggerService {
  private readonly logger = new Logger(TxLoggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService
  ) {}

  /**
   * Logs a transaction to the database and waits for its receipt to update status
   */
  async logTransaction(
    txHash: string,
    contractName: string,
    functionName: string,
    fromAddress: string,
    toAddress: string,
    payload?: any
  ) {
    this.logger.log(`Logging pending tx ${txHash} for ${contractName}.${functionName}`);
    
    await this.prisma.blockchainTx.create({
      data: {
        txHash,
        contractName,
        functionName,
        fromAddress,
        toAddress,
        payload: payload ? JSON.parse(JSON.stringify(payload, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )) : null,
        status: TxStatus.PENDING
      }
    });

    // Wait for receipt asynchronously without blocking the caller
    this.waitForReceipt(txHash).catch(err => {
      this.logger.error(`Error waiting for receipt for tx ${txHash}`, err);
    });
  }

  private async waitForReceipt(txHash: string) {
    try {
      // Wait for 1 confirmation
      const receipt = await this.blockchain.provider.waitForTransaction(txHash, 1);
      if (!receipt) return;

      const isSuccess = receipt.status === 1;
      
      await this.prisma.blockchainTx.update({
        where: { txHash },
        data: {
          status: isSuccess ? TxStatus.CONFIRMED : TxStatus.FAILED,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          confirmedAt: new Date()
        }
      });

      this.logger.log(`Tx ${txHash} confirmed in block ${receipt.blockNumber}`);
    } catch (e: any) {
      await this.prisma.blockchainTx.update({
        where: { txHash },
        data: {
          status: TxStatus.FAILED,
          errorMessage: e.message
        }
      });
    }
  }
}
