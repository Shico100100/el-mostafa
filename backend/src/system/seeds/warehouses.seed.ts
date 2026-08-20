import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedWarehouses(qr: QueryRunner) {
  await insertIgnore(qr, 'warehouses', [
    {
      id: 1,
      name: 'Main Warehouse',
      location: 'المخزن الرئيسي - المصنع',
      is_active: true,
    },
    {
      id: 2,
      name: 'Raw Materials Warehouse',
      location: 'مخزن المواد الخام',
      is_active: true,
    },
  ]);
}
