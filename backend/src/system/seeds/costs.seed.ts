import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedCosts(qr: QueryRunner) {
  await insertIgnore(qr, 'fixed_costs', [
    {
      id: 1,
      month: '2026-05',
      category: 'ELECTRICITY',
      amount: 15000,
      notes: 'فاتورة كهرباء المصنع - مايو',
    },
    {
      id: 2,
      month: '2026-05',
      category: 'RENT',
      amount: 25000,
      notes: 'إيجار المصنع - مايو',
    },
    {
      id: 3,
      month: '2026-05',
      category: 'MAINTENANCE',
      amount: 5000,
      notes: 'صيانة دورية للماكينات - مايو',
    },
  ]);
}
