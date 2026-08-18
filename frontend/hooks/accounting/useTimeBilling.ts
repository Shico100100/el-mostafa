'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface TimeEntry {
  id: number;
  date: string;
  job?: { id: number; name: string } | null;
  hours: number;
  description?: string;
  is_billable: boolean;
  is_billed: boolean;
  billing_rate?: number;
}

export function useTimeBilling() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [unbilled, setUnbilled] = useState<TimeEntry[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, unbilledData] = await Promise.all([
        api.fetchWithAuth<TimeEntry[]>('/accounting/time-billing/entries'),
        api.fetchWithAuth<TimeEntry[]>('/accounting/time-billing/unbilled'),
      ]);
      setEntries(entriesData || []);
      setUnbilled(unbilledData || []);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const markBilled = async (ids: number[]) => {
    try {
      await api.fetchWithAuth('/accounting/time-billing/bill', { method: 'POST', body: JSON.stringify({ ids }) });
      toast.success('تم تقييد الفواتير');
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, entries, unbilled, markBilled };
}
