import { Controller, Get, Post, Put, Param, Body, ParseIntPipe } from '@nestjs/common';
import { FixedAssetService } from './fixed-asset.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';

@Controller('accounting/fixed-assets')
export class FixedAssetController {
  constructor(private service: FixedAssetService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateFixedAssetDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateFixedAssetDto>) { return this.service.update(id, dto); }

  @Post(':id/depreciate')
  depreciate(@Param('id', ParseIntPipe) id: number, @Body() body: { period: string }) { return this.service.depreciate(id, body.period); }

  @Post(':id/dispose')
  dispose(@Param('id', ParseIntPipe) id: number, @Body() body: { disposalDate: string; disposalAmount: number }) { return this.service.dispose(id, body.disposalDate, body.disposalAmount); }

  @Get(':id/depreciation-schedule')
  getSchedule(@Param('id', ParseIntPipe) id: number) { return this.service.getSchedule(id); }
}
