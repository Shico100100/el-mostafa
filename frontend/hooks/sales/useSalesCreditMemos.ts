'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface SalesCreditMemo {
  id: number;
  customer_id: number;
  customer?: { id: number; name: string; phone?: string; email?: string };
  total_amount: number | string;
  date: string;
  reference?: string | null;
  reason?: string | null;
  status: string;
  created_at?: string;
}

export function useSalesCreditMemos() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [memos, setMemos] = useState<SalesCreditMemo[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<SalesCreditMemo[]>('/sales/credit-memos');
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
