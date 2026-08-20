'use client';

interface StockHealthDonutProps {
  inStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  total: number;
}

export function StockHealthDonut({ inStock, lowStockCount, outOfStockCount, total }: StockHealthDonutProps) {
  const inPct = (inStock / total) * 100;
  const lowPct = (lowStockCount / total) * 100;

  return (
    <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <h2 className="text-lg font-bold text-white mb-6">حالة المخزون</h2>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <div className="w-full h-full rounded-full" style={{
            background: `conic-gradient(#10b981 0% ${inPct}%, #f59e0b ${inPct}% ${inPct + lowPct}%, #ef4444 ${inPct + lowPct}% 100%)`,
          }}>
            <div className="absolute inset-3 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-2xl font-black text-white">{inStock + lowStockCount + outOfStockCount}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'متوفر', count: inStock, color: 'bg-emerald-500', text: 'text-emerald-400' },
            { label: 'محدود', count: lowStockCount, color: 'bg-amber-500', text: 'text-amber-400' },
            { label: 'نفذ', count: outOfStockCount, color: 'bg-red-500', text: 'text-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className={`text-sm font-bold mr-auto ${item.text}`}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
