import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedCustomers(qr: QueryRunner) {
  await insertIgnore(qr, 'customers', [
    {
      id: 1,
      name: 'شركة الأمل للبلاستيك',
      phone: '01234567890',
      email: 'info@alamal-plastic.com',
      address: 'المنطقة الصناعية - القاهرة',
      balance: 15000,
    },
    {
      id: 2,
      name: 'مؤسسة النور للتجارة',
      phone: '01234567891',
      email: 'info@annour-trade.com',
      address: 'شارع الجمهورية - الإسكندرية',
      balance: 8500,
    },
    {
      id: 3,
      name: 'شركة البركة للمواد الغذائية',
      phone: '01234567892',
      email: 'info@albaraka-food.com',
      address: 'المنطقة الصناعية - العاشر من رمضان',
      balance: 22000,
    },
    {
      id: 4,
      name: 'مصنع المستقبل للتعليب',
      phone: '01234567893',
      email: 'info@mustaqbal-canning.com',
      address: 'مدينة السادات - المنوفية',
      balance: 5000,
    },
    {
      id: 5,
      name: 'شركة الربيع للتعبئة',
      phone: '01234567894',
      email: 'info@rabie-packing.com',
      address: 'برج العرب - الإسكندرية',
      balance: 12000,
    },
  ]);
}
