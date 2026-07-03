'use client';

import { Search } from 'lucide-react';
import type { Filters } from './types';

export function SalesOrderFilters({ filters, onFilterChange, onReset }: {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">بحث بالعميل أو الملاحظات</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">من تاريخ</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value, page: 1 })}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">إلى تاريخ</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value, page: 1 })}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <button
          onClick={onReset}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl transition text-sm font-medium"
        >
          إعادة ضبط
        </button>
      </div>
    </div>
  );
}
