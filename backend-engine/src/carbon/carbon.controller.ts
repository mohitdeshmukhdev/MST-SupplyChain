import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { DEFRA_FACTORS } from '../config/evm.config';

@Controller('api/carbon')
export class CarbonController {
  constructor(
    @InjectQueue('carbon-queue') private readonly carbonQueue: Queue,
    private readonly prisma: PrismaService
  ) {}

  @Post('simulate')
  async simulate(@Body() body: { batchId: string; vehicleType: string; distanceKm: number }) {
    if (!body.batchId || !body.vehicleType || body.distanceKm === undefined) {
      throw new BadRequestException('Missing required fields');
    }

    // Add job to BullMQ
    const job = await this.carbonQueue.add('calculate-and-log', {
      batchId: body.batchId,
      vehicleType: body.vehicleType,
      distanceKm: body.distanceKm
    });

    return { message: 'Carbon calculation queued', jobId: job.id };
  }

  @Get('factors')
  getFactors() {
    return DEFRA_FACTORS;
  }

  @Get(':batchId')
  async getCarbonLogs(@Param('batchId') batchId: string) {
    const logs = await this.prisma.carbonLog.findMany({
      where: { batchId },
      orderBy: { legIndex: 'asc' }
    });
    
    const totalEmissions = logs.reduce((sum, log) => sum + log.emissionsKg, 0);
    return { logs, totalEmissionsKg: totalEmissions };
  }
}
