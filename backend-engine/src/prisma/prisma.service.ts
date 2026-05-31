import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    
    // Supabase transaction pooler limit (as defined in backend_metrics.md)
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 3, // Prevent exhaustion of Supabase free tier connection limit
    });
    
    const adapter = new PrismaPg(pool);
    
    // Prisma v7 requires passing the driver adapter explicitly
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    this.logger.log('Connecting to Supabase Postgres via Prisma v7 adapter...');
    await this.$connect();
    this.logger.log('Prisma Database Connected');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Supabase Postgres...');
    await this.$disconnect();
    await this.pool.end();
  }
}
