import {
  Users,
  Truck,
  Package,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface EntityMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ENTITY_LABELS: Record<string, EntityMeta> = {
  customers: { label: 'العملاء', icon: Users, color: 'text-emerald-400' },
  suppliers: { label: 'الموردين', icon: Truck, color: 'text-orange-400' },
  products: { label: 'المنتجات', icon: Package, color: 'text-green-400' },
  sales_invoices: {
    label: 'فواتير المبيعات',
    icon: FileText,
    color: 'text-emerald-400',
  },
  purchase_invoices: {
    label: 'فواتير المشتريات',
    icon: FileText,
    color: 'text-rose-400',
  },
  invoice_line_items: {
    label: 'بنود الفواتير',
    icon: Package,
    color: 'text-teal-400',
  },
};

export const ACTION_LABELS: Record<string, string> = {
  inserted: 'إضافة جديدة',
  different: 'اختلاف',
  skipped: 'مطابق',
  missing: 'غير موجود في Peachtree',
  updated: 'تم التحديث',
  skipped_review: 'تم التجاهل',
};

export const REVIEW_PAGE_SIZE = 50;
