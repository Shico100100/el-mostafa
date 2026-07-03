'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { PanelWrapper } from './PanelWrapper';
import type { AccountBalance } from '@/lib/dashboard/types';

export function AccountBalancesPanel() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading');
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.fetchWithAuth<AccountBalance[]>('/v1/accounting/accounts');
        if (cancelled) return;
        if (!Array.isArray(data)) { if (!cancelled) setState('empty'); return; }
        const cashAccounts = data.filter((a) => a.type === 'ASSET' && (a.code?.startsWith('1') || a.name?.includes('نقد') || a.name?.includes('بنك') || a.name?.includes('خزينة')));
        setAccounts(cashAccounts.length === 0 ? data.slice(0, 10) : cashAccounts);
        setState(data.length === 0 ? 'empty' : 'ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [retryKey]);

  const retry = useCallback(() => { setState('loading'); setRetryKey((k) => k + 1); }, []);

  return (
    <PanelWrapper
      title="أرصدة الحسابات"
      state={state}
      emptyMessage="لا توجد حسابات بعد"
      errorMessage="فشل في تحميل أرصدة الحسابات"
      onRetry={retry}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 font-medium border-b border-white/5 mb-2">
          <span>الحساب</span>
          <span>الرصيد الحالي</span>
        </div>
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-xl transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                {acc.code || `#${acc.id}`}
              </span>
              <span className="text-sm text-slate-200 truncate">{acc.name}</span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${Number(acc.balance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number(acc.balance).toLocaleString()} ج.م
            </span>
          </div>
        ))}
      </div>
    </PanelWrapper>
  );
}
