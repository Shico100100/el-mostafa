'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { PanelWrapper } from './PanelWrapper';

interface PnLData {
  totalRevenue: number;
  totalExpenses: number;
  costOfSales: number;
  netIncome: number;
  months: { month: string; revenue: number; expenses: number }[];
}

export function RevenueExpensesPanel() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [data, setData] = useState<PnLData | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const report = await api.getProfitLossReport({ startDate, endDate }) as PnLData;
        if (cancelled) return;
        setData({
          totalRevenue: Number(report.totalRevenue) || 0,
          totalExpenses: Number(report.totalExpenses) || 0,
          costOfSales: Number(report.costOfSales) || 0,
          netIncome: Number(report.netIncome) || 0,
          months: Array.isArray(report.months) ? report.months : [],
        });
        setState('ready');
      } catch {
        if (cancelled) return;
        try {
          const trends = await api.getTrends() as { month: string; sales: number; purchases: number }[];
          if (cancelled) return;
          if (!Array.isArray(trends)) { if (!cancelled) setState('empty'); return; }
          const months = trends.map((t) => ({ month: t.month, revenue: t.sales, expenses: t.purchases }));
          const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
          const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
          setData({
            totalRevenue,
            totalExpenses,
            costOfSales: totalExpenses * 0.6,
            netIncome: totalRevenue - totalExpenses * 0.6,
            months,
          });
          setState('ready');
        } catch {
          if (!cancelled) setState('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [retryKey]);

  const retry = useCallback(() => { setState('loading'); setRetryKey((k) => k + 1); }, []);

  const maxVal = data?.months ? Math.max(...data.months.map((m) => Math.max(m.revenue, m.expenses)), 1) : 1;

  return (
    <PanelWrapper
      title="الإيرادات والمصروفات"
      state={state}
      errorMessage="فشل في تحميل بيانات الإيرادات"
      onRetry={retry}
    >
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-[10px] text-slate-400 font-medium mb-1">إجمالي الإيرادات</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums">
                {(data.totalRevenue ?? 0).toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20">
              <p className="text-[10px] text-slate-400 font-medium mb-1">إجمالي المصروفات</p>
              <p className="text-lg font-black text-rose-400 tabular-nums">
                {(data.totalExpenses ?? 0).toLocaleString()} ج.م
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-slate-400 font-medium mb-1">صافي الربح / الخسارة</p>
            <p className={`text-lg font-black tabular-nums ${(data.netIncome ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(data.netIncome ?? 0) >= 0 ? '+' : ''}{(data.netIncome ?? 0).toLocaleString()} ج.م
            </p>
          </div>

          {Array.isArray(data.months) && data.months.length > 0 && (
            <div className="h-44 relative">
              <div className="flex items-end gap-1 h-full px-1">
                {data.months.map((m, i) => {
                  const revH = (m.revenue / maxVal) * 100;
                  const expH = (m.expenses / maxVal) * 100;
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-0.5 relative group/bar"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {hoveredIdx === i && (
                        <div className="absolute bottom-full mb-2 z-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] whitespace-nowrap shadow-xl pointer-events-none">
                          <div className="text-slate-300 font-bold mb-1">{m.month}</div>
                          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />إيرادات: {m.revenue.toLocaleString()}</div>
                          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />مصروفات: {m.expenses.toLocaleString()}</div>
                        </div>
                      )}
                      <div className="w-full flex gap-px items-end" style={{ height: '100%' }}>
                        <div
                          className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-300 hover:from-emerald-500 hover:to-emerald-300"
                          style={{ height: `${Math.max(revH, 2)}%` }}
                        />
                        <div
                          className="flex-1 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm transition-all duration-300 hover:from-rose-500 hover:to-rose-300"
                          style={{ height: `${Math.max(expH, 2)}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-600 truncate w-full text-center">{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-400" /><span className="text-[9px] text-[#ecfdf5]0">الإيرادات</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-rose-400" /><span className="text-[9px] text-[#ecfdf5]0">المصروفات</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  );
}
