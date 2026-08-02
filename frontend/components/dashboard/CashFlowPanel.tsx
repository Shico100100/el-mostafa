'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import type { CashFlowData } from '@/lib/dashboard/types';
import { PanelWrapper } from './PanelWrapper';

export function CashFlowPanel() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [timeFrame, setTimeFrame] = useState(30);
  const [data, setData] = useState<{
    startingCash: number;
    inflows: number;
    outflows: number;
    projectedBalance: number;
    projection: { date: string; balance: number }[];
  } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cf = await api.getCashFlowProjection(timeFrame) as CashFlowData;
        if (cancelled) return;
        setData({
          startingCash: Number(cf.startingCash) || 0,
          inflows: Number(cf.expectedInflows) || 0,
          outflows: Number(cf.expectedOutflows) || 0,
          projectedBalance: Number(cf.projectedBalance) || 0,
          projection: Array.isArray(cf.dailyProjection) ? cf.dailyProjection : [],
        });
        setState('ready');
      } catch {
        if (cancelled) return;
        try {
          const stats: { totalSales: number; totalPurchases: number; treasuryBalance: number } = await api.getDashboardStats();
          if (cancelled) return;
          const startingCash = Number(stats.treasuryBalance) || 0;
          const dailyInflow = (Number(stats.totalSales) || 0) / 30;
          const dailyOutflow = (Number(stats.totalPurchases) || 0) / 30;
          const inflows = dailyInflow * timeFrame;
          const outflows = dailyOutflow * timeFrame;
          const projection = Array.from({ length: timeFrame }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i + 1);
            const netDaily = dailyInflow - dailyOutflow;
            return {
              date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
              balance: startingCash + netDaily * (i + 1),
            };
          });
          setData({ startingCash, inflows, outflows, projectedBalance: startingCash + inflows - outflows, projection });
          setState('ready');
        } catch {
          if (!cancelled) setState('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [timeFrame, retryKey]);

  const retry = useCallback(() => { setState('loading'); setRetryKey((k) => k + 1); }, []);

  const svgChart = useMemo(() => {
    if (!data || data.projection.length === 0) return null;
    const points = data.projection;
    const W = 400;
    const H = 120;
    const PAD = 4;
    const vals = points.map((p) => p.balance);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const stepX = (W - PAD * 2) / Math.max(points.length - 1, 1);
    const toY = (v: number) => PAD + ((maxV - v) / range) * (H - PAD * 2);
    const linePoints = points.map((p, i) => `${PAD + i * stepX},${toY(p.balance)}`).join(' ');
    const areaPoints = `${PAD},${H - PAD} ${linePoints} ${PAD + (points.length - 1) * stepX},${H - PAD}`;

    return { W, H, linePoints, areaPoints, points, stepX, toY, minV, maxV };
  }, [data]);

  return (
    <PanelWrapper
      title="التدفق النقدي المتوقع"
      state={state}
      errorMessage="فشل في تحميل بيانات التدفق النقدي"
      onRetry={retry}
      settings={
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
        >
          <option value={7}>7 أيام</option>
          <option value={30}>30 يوم</option>
          <option value={60}>60 يوم</option>
          <option value={90}>90 يوم</option>
        </select>
      }
    >
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-400 font-medium">النقد الحالي</p>
              <p className="text-sm font-bold text-slate-200 tabular-nums">{data.startingCash.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center border border-emerald-500/20">
              <p className="text-[9px] text-slate-400 font-medium">متوقع دخول</p>
              <p className="text-sm font-bold text-emerald-400 tabular-nums">+{data.inflows.toLocaleString()}</p>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-2.5 text-center border border-rose-500/20">
              <p className="text-[9px] text-slate-400 font-medium">متوقع خروج</p>
              <p className="text-sm font-bold text-rose-400 tabular-nums">-{data.outflows.toLocaleString()}</p>
            </div>
          </div>

          <div
            className={`rounded-xl p-3 text-center border ${data.projectedBalance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
          >
            <p className="text-[10px] text-slate-400 font-medium">الرصيد المتوقع بعد {timeFrame} يوم</p>
            <p className={`text-lg font-black tabular-nums ${data.projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.projectedBalance.toLocaleString()} ج.م
            </p>
          </div>

          {svgChart && (
            <div className="h-32 relative group/chart">
              <svg
                viewBox={`0 0 ${svgChart.W} ${svgChart.H}`}
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <polygon points={svgChart.areaPoints} fill="url(#cfGrad)" />
                <polyline
                  points={svgChart.linePoints}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {svgChart.points.map((p, i) => {
                  const x = 4 + i * svgChart.stepX;
                  const y = svgChart.toY(p.balance);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={hoveredIdx === i ? 4 : 2}
                      fill="#3b82f6"
                      stroke="#0f172a"
                      strokeWidth="1"
                      className="transition-all"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                })}
              </svg>
              {hoveredIdx !== null && svgChart.points[hoveredIdx] && (
                <div className="absolute top-2 right-2 z-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[9px] shadow-xl pointer-events-none">
                  <div className="text-slate-400">{svgChart.points[hoveredIdx].date}</div>
                  <div className="text-slate-200 font-bold">{svgChart.points[hoveredIdx].balance.toLocaleString()} ج.م</div>
                </div>
              )}
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[8px] text-slate-600">{svgChart.points[0]?.date}</span>
                <span className="text-[8px] text-slate-600">{svgChart.points[svgChart.points.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  );
}
