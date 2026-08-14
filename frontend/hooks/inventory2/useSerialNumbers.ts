'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  batch_number?: string;
  status: string;
  warehouse_id?: number;
  warehouse_name?: string;
  product_name?: string;
}

export function useSerialNumbers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SerialNumber[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product_id: 0, serial_number: '', batch_number: '', warehouse_id: 0 });
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const data = await api.fetchWithAuth<SerialNumber[]>(`/inventory/serial-numbers?${params}`);
      setItems(data || []);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/inventory/serial-numbers', { method: 'POST', body: JSON.stringify(form) });
      toast.success('تم إنشاء الرقم التسلسلي');
      setShowModal(false);
      setForm({ product_id: 0, serial_number: '', batch_number: '', warehouse_id: 0 });
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.fetchWithAuth(`/inventory/serial-numbers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      toast.success('تم تحديث الحالة');
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  const remove = async (id: number) => {
    try {
      await api.fetchWithAuth(`/inventory/serial-numbers/${id}`, { method: 'DELETE' });
      toast.success('تم الحذف');
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, items, showModal, setShowModal, form, setForm, filterStatus, setFilterStatus, create, updateStatus, remove };
}
