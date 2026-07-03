'use client';

import type { QCStats } from '@/components/manufacturing/qc/types';

interface Props {
  stats: QCStats | null;
}

export function QCStatsCards({ stats }: Props) {
  const rate = stats?.passRate ?? 0;
  const isLow = rate < 80;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
        <div className="text-blue-300 text-sm">إجمالي الفحوصات</div>
        <div className="text-3xl font-bold text-white">{stats?.total ?? 0}</div>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
        <div className="text-green-300 text-sm">ناجح</div>
        <div className="text-3xl font-bold text-white">{stats?.passed ?? 0}</div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
        <div className="text-red-300 text-sm">راسب</div>
        <div className="text-3xl font-bold text-white">{stats?.failed ?? 0}</div>
      </div>
      <div className={`p-6 rounded-2xl border ${isLow ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
        <div className={`${isLow ? 'text-red-300' : 'text-emerald-300'} text-sm`}>نسبة النجاح</div>
        <div className={`text-3xl font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
          {stats?.passRate != null ? `${stats.passRate.toFixed(1)}%` : '—'}
        </div>
      </div>
    </div>
  );
}
