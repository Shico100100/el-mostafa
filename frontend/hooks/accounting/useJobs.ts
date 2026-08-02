'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useJobs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', estimated_cost: 0, estimated_revenue: 0, description: '' });

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<any[]>('/accounting/jobs');
      setJobs(data || []);
    } catch { toast.error('فشل تحميل المشاريع'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

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
