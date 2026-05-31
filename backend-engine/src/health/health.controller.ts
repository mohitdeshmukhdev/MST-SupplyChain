import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  async check() {
    const status: any = {
      api: 'up',
      timestamp: new Date().toISOString()
    };

    // 1. Check DB
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      status.db = 'up';
    } catch (e: any) {
      status.db = 'down';
      status.dbError = e.message;
    }

    // 2. Check Blockchain
    try {
      const blockNumber = await this.blockchain.provider.getBlockNumber();
      status.blockchain = 'up';
      status.blockNumber = blockNumber;
    } catch (e: any) {
      status.blockchain = 'down';
      status.blockchainError = e.message;
    }

    // 3. Check Redis
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL')!;
      const redis = new Redis(redisUrl, {
        tls: {},
        maxRetriesPerRequest: null,
        connectTimeout: 5000
      });
      await redis.ping();
      status.redis = 'up';
      redis.disconnect();
    } catch (e: any) {
      status.redis = 'down';
      status.redisError = e.message;
    }

    return status;
  }
}
