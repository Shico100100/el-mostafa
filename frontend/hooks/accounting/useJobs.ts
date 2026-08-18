'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Job {
  id: number;
  name: string;
  code: string;
  description?: string;
  estimated_cost: number;
  actual_cost: number;
  estimated_revenue: number;
  status: string;
}

export function useJobs() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', estimated_cost: 0, estimated_revenue: 0, description: '' });

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<Job[]>('/accounting/jobs');
      setJobs(data || []);
    } catch { toast.error('فشل تحميل المشاريع'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/accounting/jobs', { method: 'POST', body: JSON.stringify(form) });
      toast.success('تم إنشاء المشروع');
      setShowModal(false);
      setForm({ name: '', code: '', estimated_cost: 0, estimated_revenue: 0, description: '' });
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, jobs, showModal, setShowModal, form, setForm, handleSubmit };
}
