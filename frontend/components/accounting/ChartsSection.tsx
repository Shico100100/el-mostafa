'use client';

import { PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';

const PIE_COLORS = ['#10b981', '#ef4444', '#fbbf24', '#34d399', '#14b8a6'];

interface Props {
  accountTypeCounts: { name: string; value: number }[];
  topTrialBalance: { name: string; debit: number; credit: number }[];
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

function CSSDonutChart({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-full text-[#ecfdf5]0">لا توجد بيانات</div>;
  const cx = 150, cy = 130, outerR = 100, innerR = 60;
  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const start = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle: start, endAngle: currentAngle, color: colors[i % colors.length] };
  });
  return (
    <div>
      <svg viewBox="0 0 300 260" className="w-full">
        {slices.map((s, i) => (
          <PieSlice key={i} cx={cx} cy={cy} startAngle={s.startAngle} endAngle={s.endAngle}
            innerRadius={innerR} outerRadius={outerR} fill={s.color} />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
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

function BarGroup({ data, maxVal }: { data: { name: string; debit: number; credit: number }[]; maxVal: number }) {
  if (maxVal === 0) return <div className="flex items-center justify-center h-full text-[#ecfdf5]0">لا توجد بيانات</div>;
  const barW = 14, groupGap = 20;
  const totalW = data.length * (barW * 2 + groupGap) + groupGap;
  return (
    <div className="overflow-x-auto h-[300px]">
      <svg viewBox={`0 0 ${totalW} 300`} className="w-full h-full" preserveAspectRatio="xMinYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = 280 - f * 260;
          return (
            <g key={f}>
              <line x1={0} y1={y} x2={totalW} y2={y} stroke="#1f2d26" strokeDasharray="4 4" />
              <text x={0} y={y - 4} fill="#6b8378" fontSize="9">{Math.round(maxVal * f).toLocaleString()}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = groupGap + i * (barW * 2 + groupGap);
          const hD = (d.debit / maxVal) * 260;
          const hC = (d.credit / maxVal) * 260;
          return (
            <g key={i}>
              <rect x={x} y={280 - hD} width={barW} height={hD} fill="#10b981" rx="3" />
              <rect x={x + barW + 2} y={280 - hC} width={barW} height={hC} fill="#ef4444" rx="3" />
              <text x={x + barW} y={294} textAnchor="middle" fill="#6b8378" fontSize="8">
                {d.name.length > 6 ? d.name.slice(0, 6) + '..' : d.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> مدين</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" /> دائن</span>
      </div>
    </div>
  );
}

export function ChartsSection({ accountTypeCounts, topTrialBalance }: Props) {
  const maxTrial = Math.max(...topTrialBalance.map((d) => Math.max(d.debit, d.credit)), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <GlassPanel className="p-6 h-[400px]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-blue-400" />
          توزيع الحسابات
        </h3>
        <div className="h-[320px]">
          <CSSDonutChart data={accountTypeCounts} colors={PIE_COLORS} />
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 h-[400px]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-purple-400" />
          أرصدة ميزان المراجعة (لأعلى 5 حسابات)
        </h3>
        <div className="h-[320px]">
          <BarGroup data={topTrialBalance} maxVal={maxTrial} />
        </div>
      </GlassPanel>
    </div>
  );
}
