'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function usePurchaseCreditMemos() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [memos, setMemos] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<any[]>('/purchases/credit-memos');
      setMemos(data || []);
    } catch { toast.error('فشل تحميل الإشعارات الدائنة'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  return { loading, memos, loadData };
}
