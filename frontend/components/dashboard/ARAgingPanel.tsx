'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { PanelWrapper } from './PanelWrapper';
import type { AgingItem } from '@/lib/dashboard/types';

const BUCKETS = [
  { key: 'current' as const, label: 'Current', color: 'bg-emerald-500' },
  { key: 'days1_30' as const, label: '1-30 Day', color: 'bg-amber-500' },
  { key: 'days31_60' as const, label: '31-60 Day', color: 'bg-orange-500' },
  { key: 'days61_90' as const, label: '61-90 Day', color: 'bg-red-500' },
  { key: 'over90' as const, label: '+90 Day', color: 'bg-rose-600' },
];

export function ARAgingPanel() {
  const ready = useAuthCheck();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [customers, setCustomers] = useState<AgingItem[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ready) { setState('empty'); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCustomerAging();
        if (cancelled) return;
        if (!Array.isArray(data)) { if (!cancelled) setState('empty'); return; }
        setCustomers(data);
        setState(data.length === 0 ? 'empty' : 'ready');
      } catch {
        if (!cancelled) setState('empty');
      }
    })();
    return () => { cancelled = true; };
  }, [ready, retryKey]);

  const retry = useCallback(() => { setState('loading'); setRetryKey((k) => k + 1); }, []);

  return (
    <PanelWrapper
      title="تحليل أعمار ديون العملاء"
      state={state}
      emptyMessage="لا توجد أرصدة مدينة للعملاء"
      emptyAction={{ label: 'عرض العملاء', onClick: () => router.push('/sales/customers') }}
      errorMessage="فشل في تحميل بيانات العملاء"
      onRetry={retry}
    >
      <div className="space-y-4">
        <div className="flex gap-1.5">
          {BUCKETS.map((b) => (
            <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${b.color} opacity-80`} />
              <span className="text-[9px] text-slate-500 font-medium">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {customers.slice(0, 8).map((c) => (
            <div key={c.id} className="group">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-200 font-medium truncate">{c.name}</span>
                <span className="text-slate-400 font-bold tabular-nums">{c.total.toLocaleString()} ج.م</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 rounded-r-full transition-all" style={{ width: `${(c.current / c.total) * 100}%` }} />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${(c.days1_30 / c.total) * 100}%` }} />
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${(c.days31_60 / c.total) * 100}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(c.days61_90 / c.total) * 100}%` }} />
                <div className="h-full bg-rose-600 rounded-l-full transition-all" style={{ width: `${(c.over90 / c.total) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>{c.current.toLocaleString()}</span>
                <span>{c.days1_30.toLocaleString()}</span>
                <span>{c.days31_60.toLocaleString()}</span>
                <span>{c.days61_90.toLocaleString()}</span>
                <span>{c.over90.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {customers.length > 0 && (
          <button
            onClick={() => router.push('/sales/customers')}
            className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 mt-1 border-t border-white/5 transition"
          >
            عرض الكل ({customers.length})
          </button>
        )}
      </div>
    </PanelWrapper>
  );
}
