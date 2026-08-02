'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function usePeriodClose() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<any[]>('/accounting/period-close');
      setPeriods(data || []);
    } catch { toast.error('فشل تحميل الفترات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

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
