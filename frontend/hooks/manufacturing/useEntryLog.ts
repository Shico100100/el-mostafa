'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Movement, EditForm } from '@/components/manufacturing/entry-log/types';

export function useEntryLog() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('MONTH');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ quantity: '', price: '', date: '', notes: '' });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      let query = 'type=IN';

      if (filterPeriod !== 'ALL') {
        const startDate = new Date();
        const endDate = today.toISOString().split('T')[0];
        if (filterPeriod === 'DAY') startDate.setDate(today.getDate() - 1);
        if (filterPeriod === 'WEEK') startDate.setDate(today.getDate() - 7);
        if (filterPeriod === 'MONTH') startDate.setMonth(today.getMonth() - 1);
        if (filterPeriod === 'YEAR') startDate.setFullYear(today.getFullYear() - 1);
        query += `&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate}`;
      }

      const data = await api.fetchWithAuth(`/v1/manufacturing/stock-movements?${query}`);
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching movements:', err);
    } finally {
      setLoading(false);
    }
  }, [filterPeriod]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const handleDelete = async (id: number) => {
    try {
      await api.fetchWithAuth(`/v1/manufacturing/stock-movements/${id}`, { method: 'DELETE' });
      toast.success('تم الحذف بنجاح');
      fetchMovements();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const handleEdit = (mov: Movement) => {
    setEditingMovement(mov);
    setEditForm({
      quantity: String(mov.quantity),
      price: mov.price != null ? String(mov.price) : '',
      date: mov.date.split('T')[0],
      notes: mov.notes || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    try {
      await api.fetchWithAuth(`/v1/manufacturing/stock-movements/${editingMovement.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: parseFloat(editForm.quantity),
          price: parseFloat(editForm.price) || 0,
          date: editForm.date,
          notes: editForm.notes,
        }),
      });
      toast.success('تم التحديث بنجاح');
      setShowEditDialog(false);
      setEditingMovement(null);
      fetchMovements();
    } catch {
      toast.error('فشل التحديث');
    }
  };

  return {
    movements, loading, filterPeriod, setFilterPeriod,
    showEditDialog, editingMovement, editForm, setEditForm,
    handleEdit, handleDelete, handleSaveEdit, setShowEditDialog, setEditingMovement,
  };
}
