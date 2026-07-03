'use client';

import type { FeasibilityReport } from '@/components/manufacturing/feasibility/types';

export function SummaryCards({ report }: { report: FeasibilityReport }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
        <div className="text-gray-400 text-xs">إجمالي المنتجات</div>
        <div className="text-2xl font-bold text-white">{report.summary.totalProducts}</div>
      </div>
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
        <div className="text-gray-400 text-xs">المكونات المطلوبة</div>
        <div className="text-2xl font-bold text-white">{report.summary.totalComponents}</div>
      </div>
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
        <div className="text-gray-400 text-xs">مكونات عجز</div>
        <div className="text-2xl font-bold text-red-400">{report.summary.shortageComponents}</div>
      </div>
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
        <div className="text-gray-400 text-xs">أيام الإنتاج التقديرية</div>
        <div className="text-2xl font-bold text-blue-400">{report.summary.totalEstimatedDays}</div>
      </div>
    </div>
  );
}
