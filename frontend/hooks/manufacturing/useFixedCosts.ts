'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { FixedCost } from '@/components/manufacturing/fixed-costs/types';

export function useFixedCosts() {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: 'OTHER',
    amount: '',
    notes: '',
  });

  const fetchCosts = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth(`/manufacturing/fixed-costs?year=${currentYear}`);
      setCosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching fixed costs:', err);
      setCosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/manufacturing/fixed-costs', {
        method: 'POST',
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });
      toast.success('تمت الإضافة بنجاح');
      setShowAddDialog(false);
      setFormData(prev => ({ ...prev, amount: '', notes: '' }));
      fetchCosts();
    } catch {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.fetchWithAuth(`/manufacturing/fixed-costs/${id}`, { method: 'DELETE' });
      toast.success('تم الحذف');
      fetchCosts();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setFormData(prev => ({ ...prev, amount: '', notes: '' }));
  };

  const totalAmount = costs.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    costs, loading, currentYear, setCurrentYear,
    showAddDialog, setShowAddDialog, formData, setFormData,
    totalAmount, fetchCosts, handleSubmit, handleDelete, closeDialog,
  };
}
