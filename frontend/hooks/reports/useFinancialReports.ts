'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useFinancialReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [agedReceivables, setAgedReceivables] = useState<any[]>([]);
  const [agedPayables, setAgedPayables] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [bs, pl, ar, ap, cf] = await Promise.all([
        api.fetchWithAuth<any>('/reports/balance-sheet'),
        api.fetchWithAuth<any>('/reports/profit-loss-journal').catch(() => null),
        api.fetchWithAuth<any>('/reports/aged-receivables').catch(() => []),
        api.fetchWithAuth<any>('/reports/aged-payables').catch(() => []),
        api.fetchWithAuth<any>('/reports/cash-flow-statement').catch(() => null),
      ]);
      setBalanceSheet(bs);
      setProfitLoss(pl);
      setAgedReceivables(ar || []);
      setAgedPayables(ap || []);
      setCashFlow(cf);
    } catch { toast.error('فشل تحميل التقارير'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  return { loading, balanceSheet, profitLoss, agedReceivables, agedPayables, cashFlow };
}
