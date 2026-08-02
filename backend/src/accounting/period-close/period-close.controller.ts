import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PeriodCloseService } from './period-close.service';

@Controller('accounting/period-close')
export class PeriodCloseController {
  constructor(private service: PeriodCloseService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':period/status')
  async checkStatus(@Param('period') period: string) {
    const closed = await this.service.isPeriodClosed(period);
    return { period, closed };
  }

  @Post('close')
  closePeriod(@Body() body: { period: string; closedBy: string }) {
    return this.service.closePeriod(body.period, body.closedBy);
  }

  @Post('reopen')
  reopenPeriod(@Body() body: { period: string }) {
    return this.service.reopenPeriod(body.period);
  }
}
