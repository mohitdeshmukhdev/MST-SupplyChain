import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      name: 'MST Supply Chain API',
      version: '1.0.0',
      status: 'running',
      docs: '/api/docs',
      health: '/health',
    };
  }
}
