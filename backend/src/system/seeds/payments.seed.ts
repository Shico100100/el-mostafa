import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedPayments(qr: QueryRunner) {
  await insertIgnore(qr, 'supplier_payments', [
    {
      id: 1,
      supplier_id: 1,
      amount: 17000,
      amount_foreign: 557.38,
      currency_code: 'USD',
      exchange_rate: 30.5,
      payment_date: '2026-05-15',
      notes: 'دفعة HDPE',
    },
    {
      id: 2,
      supplier_id: 3,
      amount: 14000,
      payment_date: '2026-05-20',
      notes: 'دفعة PP',
    },
  ]);

  await insertIgnore(qr, 'customer_payments', [
    {
      id: 1,
      customer_id: 1,
      amount: 13500,
      payment_date: '2026-05-15',
      notes: 'دفعة كراسي',
    },
    {
      id: 2,
      customer_id: 2,
      amount: 13000,
      payment_date: '2026-05-20',
      notes: 'دفعة طاولات وصناديق',
    },
    {
      id: 3,
      customer_id: 5,
      amount: 22800,
      payment_date: '2026-05-25',
      notes: 'دفعة طلب متنوع',
    },
  ]);
}
