import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedAccounting(qr: QueryRunner) {
  await insertIgnore(qr, 'accounts', [
    {
      id: 1,
      code: '101',
      name: 'Cash',
      type: 'ASSET',
      description: 'النقدية بالصندوق',
      balance: 50000,
    },
    {
      id: 2,
      code: '102',
      name: 'Bank',
      type: 'ASSET',
      description: 'البنك',
      balance: 200000,
    },
    {
      id: 3,
      code: '201',
      name: 'Accounts Payable',
      type: 'LIABILITY',
      description: 'حسابات دائنة',
      balance: 0,
    },
    {
      id: 4,
      code: '301',
      name: 'Sales Revenue',
      type: 'REVENUE',
      description: 'إيرادات المبيعات',
      balance: 0,
    },
    {
      id: 5,
      code: '401',
      name: 'Cost of Goods Sold',
      type: 'EXPENSE',
      description: 'تكلفة البضاعة المباعة',
      balance: 0,
    },
  ]);

  await insertIgnore(qr, 'journal_entries', [
    {
      id: 1,
      date: '2026-05-05',
      description: 'تسجيل مبيعات كراسي - شركة الأمل',
      reference: 'SO-2026-001',
      account_id: 1,
      debit: 13500,
      credit: 0,
    },
    {
      id: 2,
      date: '2026-05-05',
      description: 'تسجيل مبيعات كراسي - شركة الأمل',
      reference: 'SO-2026-001',
      account_id: 4,
      debit: 0,
      credit: 13500,
    },
    {
      id: 3,
      date: '2026-05-10',
      description: 'تسجيل مبيعات طاولات وصناديق',
      reference: 'SO-2026-002',
      account_id: 1,
      debit: 13000,
      credit: 0,
    },
    {
      id: 4,
      date: '2026-05-10',
      description: 'تسجيل مبيعات طاولات وصناديق',
      reference: 'SO-2026-002',
      account_id: 4,
      debit: 0,
      credit: 13000,
    },
    {
      id: 5,
      date: '2026-05-02',
      description: 'شراء HDPE من شركة الخليج',
      reference: 'PO-2026-001',
      account_id: 5,
      debit: 17000,
      credit: 0,
    },
  ]);
}
