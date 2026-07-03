'use client';

import { STATUS_MAP } from '@/components/manufacturing/traceability/types';
import { Search, X } from 'lucide-react';

interface Props {
  filter: string;
  statusFilter: string;
  searchBatch: string;
  traceResultsActive: boolean;
  onFilterChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onSearchBatchChange: (v: string) => void;
  onTrace: () => void;
  onClear: () => void;
}

export function TraceabilityFilters({
  filter, statusFilter, searchBatch, traceResultsActive,
  onFilterChange, onStatusFilterChange, onSearchBatchChange,
  onTrace, onClear,
}: Props) {
  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      <div className="flex-1 min-w-[250px] relative">
        <input
          type="text"
          placeholder="بحث برقم الدفعة أو اسم المنتج..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
      >
        <option value="">كل الحالات</option>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="تتبع بـ batch المورد..."
          value={searchBatch}
          onChange={(e) => onSearchBatchChange(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 transition w-56"
          onKeyDown={(e) => e.key === 'Enter' && onTrace()}
        />
        <button onClick={onTrace} className="px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition text-sm font-bold flex items-center gap-2">
          <Search /> تتبع
        </button>
        {traceResultsActive && (
          <button onClick={onClear} className="px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm flex items-center gap-2">
            <X /> مسح
          </button>
        )}
      </div>
    </div>
  );
}
