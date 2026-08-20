import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedSuppliers(qr: QueryRunner) {
  await insertIgnore(qr, 'suppliers', [
    {
      id: 1,
      name: 'شركة الخليج للبتروكيماويات',
      phone: '01234567895',
      email: 'sales@gulf-petrochem.com',
      address: 'الدمام - المملكة العربية السعودية',
      balance: 0,
    },
    {
      id: 2,
      name: 'مؤسسة الصين للتجارة',
      phone: '01234567896',
      email: 'sales@china-trade.cn',
      address: 'غوانزو - الصين',
      balance: 0,
    },
    {
      id: 3,
      name: 'الشركة المصرية للمواد الخام',
      phone: '01234567897',
      email: 'info@egypt-rawmaterials.com',
      address: 'السادس من أكتوبر - الجيزة',
      balance: 0,
    },
    {
      id: 4,
      name: 'مؤسسة الإتحاد للتوريدات',
      phone: '01234567898',
      email: 'info@ittihad-supplies.com',
      address: 'المنصورة - الدقهلية',
      balance: 0,
    },
  ]);
}
