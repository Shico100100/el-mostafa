import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ManufacturingOrderService } from './manufacturing-order.service';
import { ManufacturingOrderStatus } from './entities/manufacturing-order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('manufacturing/manufacturing-orders')
@UseGuards(JwtAuthGuard)
export class ManufacturingOrderController {
  constructor(private moService: ManufacturingOrderService) {}

  @Get()
  findAll(@Query() query: { status?: string; sales_order_id?: number }) {
    return this.moService.findAll(query);
  }

  @Post('from-sales-order/:salesOrderId')
  createFromSalesOrder(@Param('salesOrderId') salesOrderId: string) {
    return this.moService.createFromSalesOrder(+salesOrderId);
  }

  @Get('by-sales-order/:salesOrderId')
  findBySalesOrder(@Param('salesOrderId') salesOrderId: string) {
    return this.moService.findBySalesOrder(+salesOrderId);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ManufacturingOrderStatus,
  ) {
    return this.moService.updateStatus(+id, status);
  }

  @Put(':id/produced')
  updateProduced(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.moService.updateProduced(+id, quantity);
  }
}
