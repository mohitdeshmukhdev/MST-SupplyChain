import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly logger = new Logger(EventListenerService.name);
  private lastQueriedBlock: number;

  constructor(
    private readonly blockchain: BlockchainService,
    @InjectQueue('carbon-queue') private readonly carbonQueue: Queue
  ) {}

  async onModuleInit() {
    // Start polling from current block
    this.lastQueriedBlock = await this.blockchain.provider.getBlockNumber();
    this.logger.log(`Starting HTTP polling for CustodyTransferred events from block ${this.lastQueriedBlock}`);
    
    // Poll every 15 seconds
    setInterval(() => this.pollEvents(), 15000);
  }

  private async pollEvents() {
    try {
      const latestBlock = await this.blockchain.provider.getBlockNumber();
      if (latestBlock <= this.lastQueriedBlock) return;

      const batchContract = this.blockchain.getContract('BatchRegistry');
      const filter = batchContract.filters.CustodyTransferred();
      
      // Query events from last known block to latest
      const events = await batchContract.queryFilter(filter, this.lastQueriedBlock + 1, latestBlock);
      
      for (const event of events) {
        // Check if it's an EventLog
        if ('args' in event && event.args) {
          const [batchIdBig, fromAddr, toAddr] = event.args;
          const batchId = batchIdBig.toString();
          
          this.logger.verbose(`[LIVE BLOCK EVENT] Intercepted Custody Handover for batch: ${batchId}`);
          
          // Dispatch to background queue for DEFRA processing
          await this.carbonQueue.add('calculate-and-log', {
            batchId,
            fromAddress: fromAddr,
            toAddress: toAddr,
            // These would normally come from IoT hardware, simulating for demo:
            vehicleType: 'REFRIGERATED_TRUCK',
            distanceKm: 340,
            telemetryHash: '0xmocktelemetryhash'
          }, {
            attempts: 3,
            backoff: 5000
          });

          this.logger.log(`Added job to carbon-queue for batch ${batchId}`);
        }
      }

      this.lastQueriedBlock = latestBlock;
    } catch (error) {
      this.logger.error('Error polling blockchain events', error);
    }
  }
}
