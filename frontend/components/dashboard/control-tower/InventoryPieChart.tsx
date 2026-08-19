'use client';

import { useState } from 'react';

const COLORS = ['#14b8a6', '#14b8a6', '#f59e0b', '#ef4444', '#14b8a6'];

interface InventoryValue {
  [key: string]: unknown;
  name: string;
  value: number;
}

interface InventoryPieChartProps { data: InventoryValue[] }

export function InventoryPieChart({ data }: InventoryPieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const size = 300;
  const cx = size / 2;
  const cy = size / 2 - 10;
  const outerR = 110;
  const innerR = 80;

  let accAngle = -90;
  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = accAngle;
    accAngle += angle;
    const endAngle = accAngle;
    const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    const labelR = outerR + 20;
    return {
      ...d,
      color: COLORS[i % COLORS.length],
      startAngle,
      endAngle,
      percent: ((d.value / total) * 100).toFixed(0),
      labelX: cx + Math.cos(midAngle) * labelR,
      labelY: cy + Math.sin(midAngle) * labelR,
    };
  });

  const arcPath = (sa: number, ea: number, oR: number, iR: number) => {
    const s = sa * (Math.PI / 180);
    const e = ea * (Math.PI / 180);
    const large = ea - sa > 180 ? 1 : 0;
    const x1 = cx + oR * Math.cos(s);
    const y1 = cy + oR * Math.sin(s);
    const x2 = cx + oR * Math.cos(e);
    const y2 = cy + oR * Math.sin(e);
    const x3 = cx + iR * Math.cos(e);
    const y3 = cy + iR * Math.sin(e);
    const x4 = cx + iR * Math.cos(s);
    const y4 = cy + iR * Math.sin(s);
    return `M${x1},${y1} A${oR},${oR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${iR},${iR} 0 ${large} 0 ${x4},${y4} Z`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
      <h2 className="text-xl font-bold mb-6">توزيع قيمة المخزون</h2>
      <div className="h-[300px] w-full flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="max-h-full">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={arcPath(seg.startAngle, seg.endAngle, outerR, innerR)}
              fill={seg.color}
              opacity={hoveredIdx === i ? 1 : 0.85}
              stroke="#0f1714"
              strokeWidth="2"
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
          {hoveredIdx === null ? (
            <>
              <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                {total.toLocaleString()}
              </text>
              <text x={cx} y={cy + 15} textAnchor="middle" fill="#6b8378" fontSize="10">
                إجمالي القيمة
              </text>
            </>
          ) : segments[hoveredIdx] ? (
            <>
              <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                {segments[hoveredIdx].value.toLocaleString()}
              </text>
              <text x={cx} y={cy + 15} textAnchor="middle" fill="#6b8378" fontSize="10">
                {segments[hoveredIdx].name}
              </text>
              <text x={cx} y={cy + 30} textAnchor="middle" fill={segments[hoveredIdx].color} fontSize="11" fontWeight="bold">
                {segments[hoveredIdx].percent}%
              </text>
            </>
          ) : null}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {segments.map((seg, i) => (
          <div key={i}
            className={`flex items-center gap-2 text-xs transition-opacity ${hoveredIdx === i ? 'opacity-100' : 'opacity-70'}`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-300">{seg.name}</span>
            <span className="text-slate-500">({seg.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
