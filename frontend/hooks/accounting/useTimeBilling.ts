'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useTimeBilling() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [unbilled, setUnbilled] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, unbilledData] = await Promise.all([
        api.fetchWithAuth<any[]>('/accounting/time-billing/entries'),
        api.fetchWithAuth<any[]>('/accounting/time-billing/unbilled'),
      ]);
      setEntries(entriesData || []);
      setUnbilled(unbilledData || []);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const markBilled = async (ids: number[]) => {
    try {
      await api.fetchWithAuth('/accounting/time-billing/bill', { method: 'POST', body: JSON.stringify({ ids }) });
      toast.success('تم تقييد الفواتير');
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, entries, unbilled, markBilled };
}
