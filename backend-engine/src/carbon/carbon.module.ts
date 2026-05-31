import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CarbonController } from './carbon.controller';
import { CarbonProcessor } from './carbon.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'carbon-queue',
    }),
  ],
  controllers: [CarbonController],
  providers: [CarbonProcessor],
})
export class CarbonModule {}
