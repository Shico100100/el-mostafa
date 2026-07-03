'use client';

import type { FeasibilityReport } from '@/components/manufacturing/feasibility/types';

export function OverallStatus({ report }: { report: FeasibilityReport }) {
  const overallColor = (o: string) => {
    switch (o) {
      case 'FEASIBLE': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PARTIAL': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'NOT_FEASIBLE': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };
  const overallText = (o: string) => {
    switch (o) {
      case 'FEASIBLE': return 'ممكن';
      case 'PARTIAL': return 'ممكن جزئياً';
      case 'NOT_FEASIBLE': return 'غير ممكن';
      default: return o;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border text-center ${overallColor(report.overall)}`}>
      <div className="text-3xl font-bold mb-2">الحالة العامة: {overallText(report.overall)}</div>
      <div className="text-sm opacity-80">
        {report.summary.totalProducts} منتج | {report.summary.totalComponents} مكون | {report.summary.shortageComponents} مكون عجز | ~{report.summary.totalEstimatedDays} يوم تقديري
      </div>
    </div>
  );
}
