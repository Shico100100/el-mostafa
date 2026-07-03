import { Controller, Get, Param } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currencies')
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('convert/:amount/:from/:to')
  convert(@Param('amount') amount: number, @Param('from') from: string, @Param('to') to: string) {
    return this.service.convert(amount, from, to);
  }
}
