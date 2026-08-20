'use client';

import { Search, Filter } from 'lucide-react';
import { typeOptions } from '@/components/inventory2/bulk-prices/types';

interface Props {
  search: string;
  typeFilter: string;
  selectAll: boolean;
  filteredCount: number;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
  onSelectAllToggle: () => void;
}

export function ProductFilters({
  search: searchVal, typeFilter, selectAll, filteredCount,
  onSearchChange, onTypeFilterChange, onSelectAllToggle,
}: Props) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center mb-6">
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={selectAll}
          onChange={onSelectAllToggle}
          className="w-4 h-4 rounded border-white/20 bg-slate-900/50"
        />
        تحديد الكل ({filteredCount})
      </label>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ecfdf5]0" />
        <input
          type="text"
          placeholder="بحث عن منتج..."
          value={searchVal}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-[#ecfdf5]0 focus:outline-none focus:border-emerald-500"
        />
      </div>
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
      >
        {typeOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Filter className="w-4 h-4 text-[#ecfdf5]0" />
    </div>
  );
}
