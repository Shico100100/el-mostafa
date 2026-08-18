export type { Product } from '@/types/product';

export const typeOptions = [
  { value: '', label: 'كل الأنواع' },
  { value: 'FINISHED', label: 'منتج تام' },
  { value: 'IMPORTED', label: 'مستورد' },
  { value: 'PACKAGING', label: 'تغليف' },
  { value: 'RAW', label: 'خام' },
  { value: 'SEMI_FINISHED', label: 'نصف مصنع' },
];

export const fieldOptions = [
  { value: 'cost_price', label: 'سعر التكلفة' },
  { value: 'selling_price', label: 'سعر البيع' },
];

export const updateTypeOptions = [
  { value: 'percentage', label: 'نسبة مئوية (%)' },
  { value: 'fixed', label: 'قيمة ثابتة (ج.م)' },
];
