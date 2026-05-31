import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { IdentityService } from './identity.service';

@Controller('api/identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('register')
  async register(@Body() body: { walletAddress: string; legalName: string; entityType: string; kycDocCid: string }) {
    if (!body.walletAddress || !body.legalName || !body.entityType || !body.kycDocCid) {
      throw new BadRequestException('Missing required fields: walletAddress, legalName, entityType, kycDocCid');
    }
    return this.identityService.registerIdentity(body.walletAddress, body.legalName, body.entityType, body.kycDocCid);
  }

  @Post('verify')
  async verify(@Body() body: { walletAddress: string }) {
    if (!body.walletAddress) throw new BadRequestException('Missing wallet address');
    return this.identityService.verifyIdentity(body.walletAddress);
  }

  @Get(':walletAddress')
  async getIdentity(@Param('walletAddress') walletAddress: string) {
    return this.identityService.getIdentity(walletAddress);
  }
}
