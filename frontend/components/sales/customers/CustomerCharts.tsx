'use client';

import { Customer, CustomerStats } from './types';

interface CustomerChartsProps {
  stats: CustomerStats;
  customers: Customer[];
}

function PieSlice({ cx, cy, startAngle, endAngle, innerRadius, outerRadius, fill }: {
  cx: number; cy: number; startAngle: number; endAngle: number;
  innerRadius: number; outerRadius: number; fill: string;
}) {
  const angleRad = (a: number) => (a - 90) * (Math.PI / 180);
  const x1 = cx + outerRadius * Math.cos(angleRad(startAngle));
  const y1 = cy + outerRadius * Math.sin(angleRad(startAngle));
  const x2 = cx + outerRadius * Math.cos(angleRad(endAngle));
  const y2 = cy + outerRadius * Math.sin(angleRad(endAngle));
  const ix1 = cx + innerRadius * Math.cos(angleRad(endAngle));
  const iy1 = cy + innerRadius * Math.sin(angleRad(endAngle));
  const ix2 = cx + innerRadius * Math.cos(angleRad(startAngle));
  const iy2 = cy + innerRadius * Math.sin(angleRad(startAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return (
    <path
      d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${ix2} ${iy2} Z`}
      fill={fill} stroke="none"
    />
  );
}

function CSSDonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات</div>;
  const cx = 150, cy = 110, outerR = 90, innerR = 60;
  let currentAngle = 0;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const start = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle: start, endAngle: currentAngle };
  });
  return (
    <div>
      <svg viewBox="0 0 300 220" className="w-full">
        {slices.map((s, i) => (
          <PieSlice key={i} cx={cx} cy={cy} startAngle={s.startAngle} endAngle={s.endAngle}
            innerRadius={innerR} outerRadius={outerR} fill={s.color} />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            {s.name}: {s.value}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }: { data: { name: string; value: number }[]; maxVal: number }) {
  if (maxVal === 0) return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات</div>;
  const barW = 30, gap = 16;
  const totalW = data.length * (barW + gap) + gap;
  return (
    <div className="overflow-x-auto h-full">
      <svg viewBox={`0 0 ${totalW} 250`} className="w-full h-full" preserveAspectRatio="xMinYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = 220 - f * 200;
          return (
            <g key={f}>
              <line x1={0} y1={y} x2={totalW} y2={y} stroke="#ffffff10" />
              <text x={0} y={y - 4} fill="#6b8378" fontSize="9">{Math.round(maxVal * f / 1000)}k</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = gap + i * (barW + gap);
          const h = (d.value / maxVal) * 200;
          return (
            <g key={i}>
              <rect x={x} y={220 - h} width={barW} height={h} fill="#10b981" rx="4" />
              <text x={x + barW / 2} y={236} textAnchor="middle" fill="#6b8378" fontSize="9">{d.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CustomerCharts({ stats }: CustomerChartsProps) {
  const pieData = [
    { name: 'أمين', value: stats.cleanCount, color: '#10b981' },
    { name: 'مدين', value: stats.debtorsCount - Math.floor(stats.debtorsCount * 0.3), color: '#f59e0b' },
    { name: 'مدين متأخر', value: Math.floor(stats.debtorsCount * 0.3), color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const barData = [
    { name: 'يناير', value: 45000 },
    { name: 'فبراير', value: 52000 },
    { name: 'مارس', value: 48000 },
    { name: 'أبريل', value: 61000 },
    { name: 'مايو', value: 55000 },
    { name: 'يونيو', value: 67000 },
  ];
  const maxBar = Math.max(...barData.map((d) => d.value), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">توزيع الديون</h3>
        <div className="h-[250px]">
          <CSSDonutChart data={pieData} />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">المبيعات الأخيرة</h3>
        <div className="h-[250px]">
          <BarChart data={barData} maxVal={maxBar} />
        </div>
      </div>
    </div>
  );
}
