import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('anchor')
  async anchor(@Body() body: {
    batchId: string;
    temperatureC: number;
    humidityPct: number;
    gpsLat: number;
    gpsLng: number;
    isBreached: boolean;
    breachReason: string;
  }) {
    if (!body.batchId || body.temperatureC === undefined) {
      throw new BadRequestException('Missing required fields');
    }
    return this.telemetryService.anchorTelemetry(
      body.batchId,
      body.temperatureC,
      body.humidityPct,
      body.gpsLat,
      body.gpsLng,
      body.isBreached || false,
      body.breachReason || ""
    );
  }
}
