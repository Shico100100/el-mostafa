'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface FixedAsset {
  id: number;
  asset_code: string;
  name: string;
  category?: string;
  status: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  book_value: number;
}

export function useFixedAssets() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', asset_code: '', category: '', purchase_date: '', purchase_cost: 0, salvage_value: 0, useful_life_years: 5, depreciation_method: 'STRAIGHT_LINE' });

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<FixedAsset[]>('/accounting/fixed-assets');
      setAssets(data || []);
    } catch { toast.error('فشل تحميل الأصول'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/accounting/fixed-assets', { method: 'POST', body: JSON.stringify(form) });
      toast.success('تم إضافة الأصل');
      setShowModal(false); loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  const depreciate = async (id: number, period: string) => {
    try {
      await api.fetchWithAuth(`/accounting/fixed-assets/${id}/depreciate`, { method: 'POST', body: JSON.stringify({ period }) });
      toast.success('تم حساب الإهلاك');
      loadData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'حدث خطأ'); }
  };

  return { loading, assets, showModal, setShowModal, form, setForm, handleSubmit, depreciate, loadData };
}
