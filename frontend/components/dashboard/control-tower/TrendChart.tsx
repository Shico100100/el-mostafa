'use client';

import { useState } from 'react';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface TrendChartProps { data: Trend[] }

export function TrendChart({ data }: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 500;
  const H = 300;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap((d) => [d.sales, d.purchases]);
  const maxVal = Math.max(...allVals, 1);
  const stepX = plotW / Math.max(data.length - 1, 1);
  const toX = (i: number) => PAD.left + i * stepX;
  const toY = (v: number) => PAD.top + ((maxVal - v) / maxVal) * plotH;

  const salesPoints = data.map((d, i) => `${toX(i)},${toY(d.sales)}`).join(' ');
  const purchasePoints = data.map((d, i) => `${toX(i)},${toY(d.purchases)}`).join(' ');
  const salesArea = `${toX(0)},${PAD.top + plotH} ${salesPoints} ${toX(data.length - 1)},${PAD.top + plotH}`;
  const purchaseArea = `${toX(0)},${PAD.top + plotH} ${purchasePoints} ${toX(data.length - 1)},${PAD.top + plotH}`;

  const gridLines = 5;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => {
    const v = (maxVal / gridLines) * i;
    return { value: v, y: toY(v) };
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">المبيعات مقابل المشتريات</h2>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div> مبيعات</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> مشتريات</div>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>

          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#ffffff10" strokeDasharray="3 3" />
              <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fill="#6b8378" fontSize="10">
                {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : Math.round(t.value)}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <text key={i} x={toX(i)} y={H - 10} textAnchor="middle" fill="#6b8378" fontSize="11">
              {d.month}
            </text>
          ))}

          <polygon points={salesArea} fill="url(#colorSales)" />
          <polyline points={salesPoints} fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          <polygon points={purchaseArea} fill="url(#colorPurchases)" />
          <polyline points={purchasePoints} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {data.map((d, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(d.sales)} r={hoveredIdx === i ? 5 : 3} fill="#14b8a6" stroke="#0f1714" strokeWidth="2" className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />
              <circle cx={toX(i)} cy={toY(d.purchases)} r={hoveredIdx === i ? 5 : 3} fill="#f43f5e" stroke="#0f1714" strokeWidth="2" className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />
              {hoveredIdx === i && (
                <g>
                  <rect x={toX(i) - 60} y={PAD.top} width="120" height="50" rx="8" fill="#0f1714" stroke="#1f2d26" />
                  <text x={toX(i)} y={PAD.top + 18} textAnchor="middle" fill="#6b8378" fontSize="9">{d.month}</text>
                  <text x={toX(i)} y={PAD.top + 33} textAnchor="middle" fill="#14b8a6" fontSize="10" fontWeight="bold">
                    مبيعات: {d.sales.toLocaleString()}
                  </text>
                  <text x={toX(i)} y={PAD.top + 47} textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">
                    مشتريات: {d.purchases.toLocaleString()}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
