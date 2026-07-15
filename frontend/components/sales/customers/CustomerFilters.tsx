'use client';

import { Search, ChevronDown, ArrowUpDown } from 'lucide-react';
import { FilterState, FilterStatus, SortField } from './types';

interface CustomerFiltersProps {
  filters: FilterState;
  onSearch: (query: string) => void;
  onFilterStatus: (status: FilterStatus) => void;
  onSort: (field: SortField, order: 'asc' | 'desc') => void;
}

export function CustomerFilters({
  filters,
  onSearch,
  onFilterStatus,
  onSort,
}: CustomerFiltersProps) {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'clean', label: 'أمين' },
    { value: 'debt', label: 'مدين' },
    { value: 'overdue', label: 'مدين متأخر' },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'name', label: 'الاسم' },
    { value: 'balance', label: 'الرصيد' },
    { value: 'createdAt', label: 'تاريخ الإنشاء' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف أو الإيميل..."
            value={filters.searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.filterStatus}
            onChange={(e) => onFilterStatus(e.target.value as FilterStatus)}
            className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSort(field as SortField, order as 'asc' | 'desc');
            }}
            className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={`${option.value}-asc`} className="bg-slate-800 text-white">
                {option.label} (تصاعدي)
              </option>
            ))}
            {sortOptions.map((option) => (
              <option key={`${option.value}-desc`} value={`${option.value}-desc`} className="bg-slate-800 text-white">
                {option.label} (تنازلي)
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
