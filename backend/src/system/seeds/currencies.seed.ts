import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedCurrencies(qr: QueryRunner) {
  await insertIgnore(qr, 'currencies', [
    { id: 1, code: 'MAD', name: 'درهم مغربي', decimalPlaces: 2 },
    { id: 2, code: 'USD', name: 'دولار أمريكي', decimalPlaces: 2 },
    { id: 3, code: 'EUR', name: 'يورو', decimalPlaces: 2 },
  ]);

  await insertIgnore(qr, 'exchange_rates', [
    { id: 1, fromCurrency: 'USD', toCurrency: 'MAD', rate: 9.85 },
    { id: 2, fromCurrency: 'EUR', toCurrency: 'MAD', rate: 10.72 },
    { id: 3, fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
    { id: 4, fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
    { id: 5, fromCurrency: 'MAD', toCurrency: 'USD', rate: 0.1 },
    { id: 6, fromCurrency: 'MAD', toCurrency: 'EUR', rate: 0.093 },
  ]);
}
