import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepo: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private rateRepo: Repository<ExchangeRate>,
  ) {}

  async findAll() {
    return this.currencyRepo.find();
  }

  async getExchangeRate(from: string, to: string) {
    if (from === to) return 1;
    const rate = await this.rateRepo.findOne({ where: { fromCurrency: from, toCurrency: to } });
    return rate?.rate || 1;
  }

  async convert(amount: number, from: string, to: string) {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }
}
