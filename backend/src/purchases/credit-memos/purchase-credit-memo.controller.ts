import { Controller, Get, Post, Put, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PurchaseCreditMemoService } from './purchase-credit-memo.service';

@Controller('purchases/credit-memos')
export class PurchaseCreditMemoController {
  constructor(private service: PurchaseCreditMemoService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() data: any) { return this.service.create(data); }

  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
