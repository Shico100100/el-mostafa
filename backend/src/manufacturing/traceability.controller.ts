import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TraceabilityService } from './traceability.service';
import { BatchStatus } from './entities/production-batch.entity';

@Controller('manufacturing/traceability')
@UseGuards(JwtAuthGuard)
export class TraceabilityController {
  constructor(private readonly service: TraceabilityService) {}

  @Get()
  findAll(@Query('status') status?: BatchStatus) {
    return this.service.findAll(status);
  }

  @Get('expiring')
  getExpiring(@Query('days', ParseIntPipe) days: number) {
    return this.service.getExpiring(days);
  }

  @Get('trace/forward')
  forwardTrace(@Query('supplierBatch') supplierBatch: string) {
    return this.service.forwardTrace(supplierBatch);
  }

  @Get('trace/backward/:batchId')
  backwardTrace(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.service.backwardTrace(batchId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body()
    dto: {
      product_id: number;
      production_date: string;
      expiry_date?: string;
      quantity: number;
      unit?: string;
      notes?: string;
      production_id?: number;
      created_by?: number;
      components?: {
        raw_material_id?: number;
        accessory_id?: number;
        supplier_batch_number?: string;
        quantity_used: number;
        unit?: string;
        cost_per_unit?: number;
      }[];
    },
  ) {
    return this.service.create(dto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: BatchStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/recall')
  recall(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.service.recall(id, reason);
  }
}
