import { Controller, Post, Param, BadRequestException } from '@nestjs/common';
import { EscrowService } from './escrow.service';

@Controller('api/escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post(':batchId/release')
  async release(@Param('batchId') batchId: string) {
    if (!batchId) throw new BadRequestException('Missing batchId');
    return this.escrowService.releaseFunds(batchId);
  }
}
