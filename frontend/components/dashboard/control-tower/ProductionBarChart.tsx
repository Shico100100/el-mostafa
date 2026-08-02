'use client';

import { useState } from 'react';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface ProductionBarChartProps { data: Trend[] }

export function ProductionBarChart({ data }: ProductionBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.production), 1);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <h2 className="text-xl font-bold mb-6">نشاط الإنتاج (عدد القطع)</h2>
      <div className="h-[300px] w-full flex items-end gap-3 px-2">
        {data.map((d, i) => {
          const pct = (d.production / maxVal) * 100;
          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-1 group/bp"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {hoveredIdx === i && (
                <div className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] whitespace-nowrap shadow-xl pointer-events-none mb-1">
                  <div className="text-slate-300 font-bold">{d.month}</div>
                  <div className="text-emerald-400">الإنتاج: {d.production.toLocaleString()}</div>
                </div>
              )}
              <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 hover:from-emerald-500 hover:to-emerald-300"
                style={{ height: `${Math.max(pct, 3)}%`, minHeight: '8px' }} />
              <span className="text-[11px] text-slate-400 truncate w-full text-center">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
