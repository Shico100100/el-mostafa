'use client';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface Stats {
  totalValue: number;
  productCount: number;
  lowStockItems: unknown[];
}

interface SummaryPanelProps {
  trends: Trend[];
  stats: Stats | null;
}

export function SummaryPanel({ trends, stats }: SummaryPanelProps) {
  const last = trends[trends.length - 1];
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
          <span className="text-slate-400">قيمة المبيعات هذا الشهر</span>
          <span className="text-xl font-bold text-indigo-400">{last?.sales?.toLocaleString()} ج.م</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
          <span className="text-slate-400">قيمة المشتريات هذا الشهر</span>
          <span className="text-xl font-bold text-rose-400">{last?.purchases?.toLocaleString()} ج.م</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-rose-500/20">
          <span className="text-slate-400">أصناف تحتاج إعادة طلب</span>
          <span className="text-xl font-bold text-rose-500">{stats?.lowStockItems?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
