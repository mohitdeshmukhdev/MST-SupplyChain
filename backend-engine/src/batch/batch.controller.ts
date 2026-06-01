import { Controller, Post, Body, Get, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('api/batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('mint')
  async mint(@Body() body: { 
    gtin: string; 
    productName: string; 
    originFacility: string; 
    quantity: number; 
    unit: string; 
    weightTonnes: number; 
    manufacturerWallet: string 
  }) {
    if (!body.gtin || !body.manufacturerWallet) {
      throw new BadRequestException('Missing required fields: gtin, manufacturerWallet');
    }
    return this.batchService.mintBatch(
      body.gtin, 
      body.productName, 
      body.originFacility, 
      body.quantity, 
      body.unit, 
      body.weightTonnes, 
      body.manufacturerWallet
    );
  }

  @Get(':id')
  async getBatch(@Param('id') id: string) {
    const batch = await this.batchService.getBatch(id);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }
    return batch;
  }

  @Get()
  async getAllBatches() {
    return this.batchService.getAllBatches();
  }

  @Post('stage')
  async updateStage(@Body() body: { batchId: string; stage: string }) {
    if (!body.batchId || !body.stage) {
      throw new BadRequestException('Missing required fields: batchId, stage');
    }
    // Need to parse string to enum
    const stageMap: Record<string, any> = {
      MINTED: 'MINTED',
      DISPATCHED: 'DISPATCHED',
      IN_TRANSIT: 'IN_TRANSIT',
      CUSTOMS_CLEARED: 'CUSTOMS_CLEARED',
      RETAIL_READY: 'RETAIL_READY',
      DISPUTED: 'DISPUTED'
    };
    
    const enumStage = stageMap[body.stage];
    if (!enumStage) {
      throw new BadRequestException(`Invalid stage: ${body.stage}`);
    }

    return this.batchService.updateStage(body.batchId, enumStage);
  }
}
