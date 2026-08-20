'use client';

import { Search, Filter } from 'lucide-react';

interface MovementsFiltersProps {
  search: string;
  typeFilter: string;
  total: number;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
}

export function MovementsFilters({ search, typeFilter, total, onSearchChange, onTypeFilterChange }: MovementsFiltersProps) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ecfdf5]0" />
        <input type="text" placeholder="بحث..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-[#ecfdf5]0 focus:outline-none focus:border-emerald-500" />
      </div>
      <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}
        className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
        <option value="">كل الحركات</option>
        <option value="IN">وارد</option>
        <option value="OUT">صادر</option>
        <option value="ADJUST">تسوية</option>
      </select>
      <Filter className="w-4 h-4 text-[#ecfdf5]0" />
      <span className="text-xs text-[#ecfdf5]0 font-mono">{total} حركة</span>
    </div>
  );
}
