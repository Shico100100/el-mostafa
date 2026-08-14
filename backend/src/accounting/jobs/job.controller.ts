import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto, CreateJobCostDto } from './dto/create-job.dto';

@Controller('accounting/jobs')
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateJobDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/costs')
  addCost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Omit<CreateJobCostDto, 'job_id'>,
  ) {
    return this.service.addCost({ ...dto, job_id: id });
  }

  @Get(':id/profitability')
  getProfitability(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProfitability(id);
  }
}
