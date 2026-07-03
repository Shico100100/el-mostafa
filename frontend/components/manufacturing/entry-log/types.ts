export interface Movement {
  id: number;
  date: string;
  product_name: string;
  quantity: number;
  price: number | null;
  notes: string;
}

export interface EditForm {
  quantity: string;
  price: string;
  date: string;
  notes: string;
}

export const PERIODS = ['ALL', 'DAY', 'WEEK', 'MONTH', 'YEAR'] as const;

export function periodLabel(p: string) {
  return p === 'ALL' ? 'الكل' : p === 'DAY' ? 'يوم' : p === 'WEEK' ? 'أسبوع' : p === 'MONTH' ? 'شهر' : 'سنة';
}
