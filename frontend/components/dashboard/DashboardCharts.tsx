'use client';

import { useState } from 'react';

const COLORS = ['#10b981', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'];

interface ChartsProps {
  salesTrend: { date: string; value: number }[];
  topCustomers: { name: string; total: number }[];
  topProducts: { name: string; total: number }[];
}

function CSSBarChart({ data, label }: { data: { name: string; total: number }[]; label: string }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">{label}</h3>
      <div className="flex items-end gap-2 h-[250px]">
        {data.map((d, i) => {
          const pct = (d.total / maxVal) * 100;
          return (
            <div key={d.name} className="flex-1 flex flex-col items-center gap-1 group/bc">
              <span className="text-[9px] text-[#ecfdf5]0 opacity-0 group-hover/bc:opacity-100 transition-opacity">
                {d.total.toLocaleString()}
              </span>
              <div
                className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                style={{ height: `${Math.max(pct, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[9px] text-[#ecfdf5]0 truncate w-full text-center">{d.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CSSLineChart({ data }: { data: { date: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const W = 400;
  const H = 220;
  const PAD = 10;
  const stepX = (W - PAD * 2) / Math.max(data.length - 1, 1);
  const toY = (v: number) => PAD + ((maxVal - v) / maxVal) * (H - PAD * 2);
  const linePoints = data.map((d, i) => `${PAD + i * stepX},${toY(d.value)}`).join(' ');
  const areaPoints = `${PAD},${H - PAD} ${linePoints} ${PAD + (data.length - 1) * stepX},${H - PAD}`;

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">مبيعات آخر 7 أيام</h3>
      <div className="h-[250px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#lineGrad)" />
          <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <circle key={i} cx={PAD + i * stepX} cy={toY(d.value)} r="3" fill="#10b981" stroke="#0a0f0d" strokeWidth="1.5" />
          ))}
          {data.map((d, i) => (
            <text key={`label-${i}`} x={PAD + i * stepX} y={H - 2} textAnchor="middle" fill="#6b8378" fontSize="9">
              {d.date}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function CSSPieChart({ data }: { data: { name: string; total: number }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0) || 1;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const innerR = 50;

  let accAngle = -90;
  const segments = data.map((d, i) => {
    const angle = (d.total / total) * 360;
    const startAngle = accAngle;
    accAngle += angle;
    const endAngle = accAngle;
    const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    const labelR = r + 20;
    return {
      ...d,
      color: COLORS[i % COLORS.length],
      startAngle,
      endAngle,
      percent: ((d.total / total) * 100).toFixed(0),
      labelX: cx + Math.cos(midAngle) * labelR,
      labelY: cy + Math.sin(midAngle) * labelR,
    };
  });

  const arcPath = (sa: number, ea: number, outerR: number, innerR: number) => {
    const s = sa * (Math.PI / 180);
    const e = ea * (Math.PI / 180);
    const large = ea - sa > 180 ? 1 : 0;
    const x1 = cx + outerR * Math.cos(s);
    const y1 = cy + outerR * Math.sin(s);
    const x2 = cx + outerR * Math.cos(e);
    const y2 = cy + outerR * Math.sin(e);
    const x3 = cx + innerR * Math.cos(e);
    const y3 = cy + innerR * Math.sin(e);
    const x4 = cx + innerR * Math.cos(s);
    const y4 = cy + innerR * Math.sin(s);
    return `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${large} 0 ${x4},${y4} Z`;
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">أكبر 5 عملاء</h3>
      <div className="flex justify-center h-[250px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="max-h-full">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={arcPath(seg.startAngle, seg.endAngle, r, innerR)}
              fill={seg.color}
              opacity={hoveredIdx === i ? 1 : 0.85}
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
          {hoveredIdx !== null && segments[hoveredIdx] && (
            <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
              {segments[hoveredIdx].total.toLocaleString()}
            </text>
          )}
          {hoveredIdx !== null && segments[hoveredIdx] && (
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b8378" fontSize="9">
              {segments[hoveredIdx].name}
            </text>
          )}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {segments.map((c, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DashboardCharts({ salesTrend, topCustomers, topProducts }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {salesTrend.length > 0 && <CSSLineChart data={salesTrend} />}
      {topCustomers.length > 0 && <CSSPieChart data={topCustomers} />}
      {topProducts.length > 0 && (
        <div className="lg:col-span-2">
          <CSSBarChart data={topProducts} label="أكثر 5 منتجات مبيعاً" />
        </div>
      )}
    </div>
  );
}
