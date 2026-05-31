import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TxLoggerService } from '../blockchain/tx-logger.service';
import { EscrowStatus } from '@prisma/client';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly txLogger: TxLoggerService
  ) {}

  async releaseFunds(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found off-chain");

    const contract = this.blockchain.getContract('EscrowRegistry');
    
    // EscrowRegistry ABI -> releaseFunds(uint256 batchId)
    try {
      const tx = await contract.releaseFunds(batch.blockchainId);
      
      const escrow = await this.prisma.escrow.update({
        where: { batchId: batch.id },
        data: {
          status: EscrowStatus.RELEASED,
          releaseTxHash: tx.hash
        }
      });

      await this.txLogger.logTransaction(
        tx.hash,
        'EscrowRegistry',
        'releaseFunds',
        this.blockchain.relayerWallet.address,
        await contract.getAddress(),
        { blockchainId: batch.blockchainId }
      );

      return { escrow, txHash: tx.hash };
    } catch (error: any) {
      throw new Error(`Failed to release funds: ${error.message}`);
    }
  }
}
