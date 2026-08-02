import { Controller, Get, Query } from '@nestjs/common';
import { PriceHistoryService } from './price-history.service';

@Controller('purchases')
export class PriceHistoryController {
  constructor(private readonly service: PriceHistoryService) {}

  @Get('price-history')
  getHistory(@Query('productId') productId?: string) {
    return this.service.getHistory(productId ? +productId : undefined);
  }
}
