import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';
import { FxRate } from '../entities/fx-rate.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepo: Repository<Currency>,
    @InjectRepository(FxRate)
    private fxRateRepo: Repository<FxRate>,
  ) {}

  async getCurrencies() {
    return this.currencyRepo.find({ where: { is_active: true } });
  }

  async getAllCurrencies() {
    return this.currencyRepo.find();
  }

  async createCurrency(data: Partial<Currency>) {
    const currency = this.currencyRepo.create(data);
    return this.currencyRepo.save(currency);
  }

  async updateCurrency(id: number, data: Partial<Currency>) {
    await this.currencyRepo.update(id, data);
    return this.currencyRepo.findOne({ where: { id } });
  }

  async deleteCurrency(id: number) {
    return this.currencyRepo.delete(id);
  }

  async getFxRates(currencyId?: number) {
    const where: any = {};
    if (currencyId) where.currency_id = currencyId;
    return this.fxRateRepo.find({
      where,
      relations: ['currency'],
      order: { rate_date: 'DESC' },
    });
  }

  async addFxRate(data: {
    currency_id: number;
    rate_to_egp: number;
    amount_paid?: number;
    notes?: string;
    rate_date: string;
  }) {
    const rate = this.fxRateRepo.create({
      ...data,
      rate_date: new Date(data.rate_date),
    });
    return this.fxRateRepo.save(rate);
  }

  async calculateWeightedAverageFx(currencyId: number): Promise<number> {
    const rates = await this.fxRateRepo.find({
      where: { currency_id: currencyId },
    });

    const paidRates = rates.filter((r) => r.amount_paid && r.amount_paid > 0);
    if (paidRates.length === 0) {
      const latest = rates[rates.length - 1];
      return latest ? Number(latest.rate_to_egp) : 1;
    }

    const totalAmount = paidRates.reduce(
      (sum, r) => sum + Number(r.amount_paid),
      0,
    );
    const weightedSum = paidRates.reduce(
      (sum, r) => sum + Number(r.amount_paid) * Number(r.rate_to_egp),
      0,
    );

    return totalAmount > 0 ? weightedSum / totalAmount : 1;
  }
}
