import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedCategories(qr: QueryRunner) {
  await insertIgnore(qr, 'categories', [
    { id: 1, name: 'Raw Materials', description: 'المواد الخام' },
    { id: 2, name: 'Finished Products', description: 'المنتجات النهائية' },
    { id: 3, name: 'Spare Parts', description: 'قطع الغيار' },
  ]);
}
