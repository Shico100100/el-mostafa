'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { PanelWrapper } from './PanelWrapper';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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
            <div className="h-44">
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={data.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="revenue" name="الإيرادات" fill="#10b981" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="expenses" name="المصروفات" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </PanelWrapper>
  );
}
