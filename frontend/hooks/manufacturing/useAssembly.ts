'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { BOM, AssemblyOrder } from '@/components/manufacturing/assembly/types';

export function useAssembly() {
  const router = useRouter();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBom, setSelectedBom] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      const [bomsData, ordersData] = await Promise.all([
        api.fetchWithAuth('/manufacturing/boms'),
        api.fetchWithAuth('/manufacturing/assembly'),
      ]);
      setBoms(sortAlphabetically(Array.isArray(bomsData) ? bomsData : ((bomsData as any)?.items ?? []), 'name'));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/manufacturing/assembly', {
        method: 'POST',
        body: JSON.stringify({
          bom_id: Number(selectedBom),
          quantity: Number(quantity),
          date,
        }),
      });
      toast.success('تم تنفيذ أمر التجميع بنجاح وتم تحديث المخزون');
      setShowModal(false);
      setQuantity('');
      setSelectedBom('');
      loadData();
    } catch {
      toast.error('تأكد من توفر رصيد كافي من الخامات');
    }
  };

  return {
    boms, orders, loading, showModal, selectedBom, quantity, date,
    setShowModal, setSelectedBom, setQuantity, setDate, handleSubmit, loadData,
  };
}
