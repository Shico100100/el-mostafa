'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AccountingPeriod {
  id: number;
  period: string;
  status: string;
  closed_by?: string | null;
  closed_at?: string | null;
}

export function usePeriodClose() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<AccountingPeriod[]>('/accounting/period-close');
      setPeriods(data || []);
    } catch { toast.error('فشل تحميل الفترات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const closePeriod = async (period: string) => {
    try {
      await api.fetchWithAuth('/accounting/period-close/close', { method: 'POST', body: JSON.stringify({ period, closedBy: 'admin' }) });
      toast.success(`تم إغلاق فترة ${period}`);
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  const reopenPeriod = async (period: string) => {
    try {
      await api.fetchWithAuth('/accounting/period-close/reopen', { method: 'POST', body: JSON.stringify({ period }) });
      toast.success(`تم فتح فترة ${period}`);
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, periods, closePeriod, reopenPeriod };
}
