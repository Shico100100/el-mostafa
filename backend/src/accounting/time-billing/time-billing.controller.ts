import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { TimeBillingService } from './time-billing.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@Controller('accounting/time-billing')
export class TimeBillingController {
  constructor(private service: TimeBillingService) {}

  @Get('entries')
  findAll(@Query() query: { job_id?: string; user_id?: string; start_date?: string; end_date?: string }) {
    return this.service.findAll({
      job_id: query.job_id ? parseInt(query.job_id) : undefined,
      user_id: query.user_id ? parseInt(query.user_id) : undefined,
      start_date: query.start_date,
      end_date: query.end_date,
    });
  }

  @Get('entries/:id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post('entries')
  create(@Body() dto: CreateTimeEntryDto) { return this.service.create(dto); }

  @Put('entries/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTimeEntryDto>) { return this.service.update(id, dto); }

  @Delete('entries/:id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Get('unbilled')
  getUnbilled() { return this.service.getUnbilled(); }

  @Post('bill')
  markBilled(@Body() body: { ids: number[] }) { return this.service.markBilled(body.ids); }

  @Get('summary/:jobId')
  getSummary(@Param('jobId', ParseIntPipe) jobId: number) { return this.service.getSummaryByJob(jobId); }
}
