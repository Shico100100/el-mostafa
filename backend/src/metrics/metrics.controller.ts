import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return register.metrics();
  }
}
