'use client';

import type { Product } from '@/components/manufacturing/molds/types';

interface MoldFiltersProps {
  searchQuery: string;
  statusFilter: string;
  productFilter: string;
  products: Product[];
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onProductChange: (v: string) => void;
}

export function MoldFilters({ searchQuery, statusFilter, productFilter, products, onSearchChange, onStatusChange, onProductChange }: MoldFiltersProps) {
  return (
    <div className="flex-1 flex gap-4">
      <input type="text" placeholder="بحث بالاسم..." value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-500" />
      <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-teal-500">
        <option value="ALL">كل الحالات</option>
        <option value="GOOD">سليمة</option>
        <option value="NEEDS_REPAIR">تحتاج صيانة</option>
        <option value="BROKEN">معطلة</option>
        <option value="MAINTENANCE">تحت الصيانة</option>
      </select>
      <select value={productFilter} onChange={e => onProductChange(e.target.value)}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-teal-500">
        <option value="ALL">كل المنتجات</option>
        {products.map(p => (
          <option key={p.id} value={p.id.toString()}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
