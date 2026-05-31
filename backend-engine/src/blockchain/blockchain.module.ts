import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BlockchainService } from './blockchain.service';
import { TxLoggerService } from './tx-logger.service';
import { EventListenerService } from './event-listener.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'carbon-queue',
    }),
  ],
  providers: [BlockchainService, TxLoggerService, EventListenerService],
  exports: [BlockchainService, TxLoggerService],
})
export class BlockchainModule {}
