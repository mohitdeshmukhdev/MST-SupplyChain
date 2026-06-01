import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { BatchStage } from '@prisma/client';

@Controller('api/checkpoint')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Post()
  async logCheckpoint(@Body() body: {
    batchId: string;
    fromAddress: string;
    toAddress: string;
    location: string;
    gpsLat?: number;
    gpsLng?: number;
    stage?: BatchStage;
  }) {
    if (!body.batchId || !body.location || !body.fromAddress) {
      throw new BadRequestException('Missing required fields: batchId, fromAddress, location');
    }

    return this.checkpointService.logCheckpoint(
      body.batchId,
      body.fromAddress,
      body.toAddress,
      body.location,
      body.gpsLat,
      body.gpsLng,
      body.stage || BatchStage.IN_TRANSIT
    );
  }
}
