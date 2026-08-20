'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { PanelWrapper } from './PanelWrapper';
import type { AgingItem } from '@/lib/dashboard/types';

export function APAgingPanel() {
  const ready = useAuthCheck();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [vendors, setVendors] = useState<AgingItem[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ready) { setState('empty'); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getSupplierAging();
        if (cancelled) return;
        if (!Array.isArray(data)) { if (!cancelled) setState('empty'); return; }
        setVendors(data);
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
      title="تحليل مستحقات الموردين"
      state={state}
      emptyMessage="لا توجد مستحقات للموردين"
      emptyAction={{ label: 'عرض الموردين', onClick: () => router.push('/purchases/suppliers') }}
      errorMessage="فشل في تحميل بيانات الموردين"
      onRetry={retry}
    >
      <div className="space-y-2">
        <div className="flex gap-1.5 mb-3">
          {[
            { label: 'حالي', color: 'bg-emerald-500' },
            { label: '1-30', color: 'bg-amber-500' },
            { label: '31-60', color: 'bg-orange-500' },
            { label: '61-90', color: 'bg-red-500' },
            { label: '+90', color: 'bg-rose-600' },
          ].map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${b.color} opacity-80`} />
              <span className="text-[9px] text-[#ecfdf5]0 font-medium">{b.label}</span>
            </div>
          ))}
        </div>

        {vendors.slice(0, 8).map((v) => {
          const hasDiscount = v.days1_30 > 0;
          return (
            <div
              key={v.id}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-xl transition group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 truncate">{v.name}</span>
                  {hasDiscount && (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      خصم
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5 flex">
                  <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: `${(v.current / v.total) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(v.days1_30 / v.total) * 100}%` }} />
                  <div className="h-full bg-orange-500" style={{ width: `${(v.days31_60 / v.total) * 100}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${(v.days61_90 / v.total) * 100}%` }} />
                  <div className="h-full bg-rose-600 rounded-l-full" style={{ width: `${(v.over90 / v.total) * 100}%` }} />
                </div>
              </div>
              <span className="text-sm font-bold text-rose-400 tabular-nums mr-3">
                {v.total.toLocaleString()} ج.م
              </span>
            </div>
          );
        })}

        {vendors.length > 0 && (
          <button
            onClick={() => router.push('/purchases/suppliers')}
            className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 mt-1 border-t border-white/5 transition"
          >
            عرض الكل ({vendors.length})
          </button>
        )}
      </div>
    </PanelWrapper>
  );
}
