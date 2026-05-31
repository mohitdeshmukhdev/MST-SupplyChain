import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('api/document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('attach')
  async attach(@Body() body: { batchId: string; docType: string; ipfsCid: string }) {
    if (!body.batchId || !body.docType || !body.ipfsCid) {
      throw new BadRequestException('Missing required fields: batchId, docType, ipfsCid');
    }
    return this.documentService.attachDocument(body.batchId, body.docType, body.ipfsCid);
  }
}
