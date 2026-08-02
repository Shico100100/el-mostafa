import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { SerialNumberService } from './serial-number.service';

@Controller('inventory/serial-numbers')
export class SerialNumberController {
  constructor(private service: SerialNumberService) {}

  @Get()
  findAll(@Query() query: { product_id?: string; status?: string }) {
    return this.service.findAll({
      product_id: query.product_id ? parseInt(query.product_id) : undefined,
      status: query.status,
    });
  }

  @Post()
  create(@Body() data: { product_id: number; serial_number: string; batch_number?: string; warehouse_id?: number }) {
    return this.service.create(data);
  }

  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string; reference_type?: string; reference_id?: number }) {
    return this.service.updateStatus(id, body.status, body.reference_type, body.reference_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
