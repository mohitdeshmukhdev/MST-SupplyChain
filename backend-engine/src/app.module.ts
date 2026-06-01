import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { validate } from './config/env.validation';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { IdentityModule } from './identity/identity.module';
import { BatchModule } from './batch/batch.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { DocumentModule } from './document/document.module';
import { EscrowModule } from './escrow/escrow.module';
import { CarbonModule } from './carbon/carbon.module';
import { HealthModule } from './health/health.module';
import { CheckpointModule } from './checkpoint/checkpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const urlString = configService.get<string>('REDIS_URL')!;
        // Handle rediss:// URLs safely
        const parsedUrl = new URL(urlString.startsWith('redis') ? urlString : `rediss://${urlString}`);
        
        return {
          connection: {
            host: parsedUrl.hostname,
            port: Number(parsedUrl.port) || 6379,
            password: parsedUrl.password || undefined,
            username: parsedUrl.username || undefined,
            tls: {}, // Required for Upstash Production
            maxRetriesPerRequest: null, // Required by BullMQ
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    BlockchainModule,
    IdentityModule,
    BatchModule,
    TelemetryModule,
    DocumentModule,
    EscrowModule,
    CarbonModule,
    HealthModule,
    CheckpointModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

