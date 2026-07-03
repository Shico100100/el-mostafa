'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CashFlowData } from '@/lib/dashboard/types';
import { PanelWrapper } from './PanelWrapper';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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

          {data.projection.length > 0 && (
            <div className="h-32">
              <ResponsiveContainer width="100%" height={128}>
                <AreaChart data={data.projection}>
                  <defs>
                    <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#cfGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  );
}
