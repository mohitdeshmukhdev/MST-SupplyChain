import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
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
    return this.batchService.getBatch(id);
  }

  @Get()
  async getAllBatches() {
    return this.batchService.getAllBatches();
  }
}
