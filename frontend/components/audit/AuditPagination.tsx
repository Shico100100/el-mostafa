'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  currentCount: number;
  onPageChange: (page: number) => void;
}

export function AuditPagination({ page, totalPages, totalItems, currentCount, onPageChange }: AuditPaginationProps) {
  return (
    <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
      <p className="text-xs text-slate-500 font-medium">عرض {currentCount} من {totalItems} سجل</p>
      <div className="flex items-center gap-4">
        <button disabled={page === 1} onClick={() => onPageChange(page - 1)}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition">
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-900/40">
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
