'use client';

import type { WarehouseOption } from '@/components/inventory2/stock/types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (v: string) => void;
  selectedType: string;
  onTypeChange: (v: string) => void;
  warehouses: WarehouseOption[];
}

export function StockFilters({ search, onSearchChange, selectedWarehouse, onWarehouseChange, selectedType, onTypeChange, warehouses }: Props) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ecfdf5]0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="بحث..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-[#ecfdf5]0 focus:outline-none focus:border-emerald-500" />
      </div>
      <select value={selectedWarehouse} onChange={(e) => onWarehouseChange(e.target.value)}
        className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 min-w-[160px]">
        <option value="">كل المخازن</option>
        {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
      </select>
      <select value={selectedType} onChange={(e) => onTypeChange(e.target.value)}
        className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 min-w-[140px]">
        <option value="">كل الأنواع</option>
        <option value="RAW">خام</option>
        <option value="SEMI_FINISHED">نصف مصنع</option>
        <option value="FINISHED">منتج تام</option>
        <option value="PACKAGING">تغليف</option>
        <option value="IMPORTED">مستورد</option>
      </select>
      <svg className="w-4 h-4 text-[#ecfdf5]0 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    </div>
  );
}
