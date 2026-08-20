import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedBoms(qr: QueryRunner) {
  await insertIgnore(qr, 'boms', [
    {
      id: 1,
      name: 'BOM - Plastic Chair 501',
      product_id: 6,
      description: 'قائمة مكونات الكرسي 501',
      carton_product_id: 6,
      box_product_id: 6,
      pcs_per_carton: 4,
      pcs_per_box: 1,
    },
    {
      id: 2,
      name: 'BOM - Table Top 60x60',
      product_id: 7,
      description: 'قائمة مكونات سطح الطاولة',
      carton_product_id: 7,
      box_product_id: 7,
      pcs_per_carton: 2,
      pcs_per_box: 1,
    },
    {
      id: 3,
      name: 'BOM - Storage Box 40L',
      product_id: 8,
      description: 'قائمة مكونات صندوق التخزين',
      carton_product_id: 8,
      box_product_id: 8,
      pcs_per_carton: 6,
      pcs_per_box: 1,
    },
  ]);

  await insertIgnore(qr, 'bom_items', [
    { id: 1, bom_id: 1, product_id: 1, quantity: 1.8 },
    { id: 2, bom_id: 1, product_id: 3, quantity: 0.05 },
    { id: 3, bom_id: 2, product_id: 2, quantity: 2.5 },
    { id: 4, bom_id: 2, product_id: 4, quantity: 0.08 },
    { id: 5, bom_id: 3, product_id: 5, quantity: 1.2 },
    { id: 6, bom_id: 3, product_id: 3, quantity: 0.04 },
  ]);
}
