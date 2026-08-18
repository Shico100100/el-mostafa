'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthCheck } from '@/lib/useAuthCheck';
import type { Machine } from '@/components/manufacturing/machines/types';

export function useMachines() {
  const router = useRouter();
  const ready = useAuthCheck();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [totalMachines, setTotalMachines] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const loadMachines = useCallback(async (search?: string, status?: string, page?: number) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (page) params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));
      const qs = params.toString();
      const data = await api.fetchWithAuth<{ machines: Machine[]; pagination: { total: number; page: number; limit: number }; stats: { overdueCount: number } }>(`/manufacturing/machines/overview${qs ? '?' + qs : ''}`);
      setMachines(data.machines);
      setTotalMachines(data.pagination.total);
      setOverdueCount(data.stats.overdueCount);
    } catch (error) {
      toast.error('فشل تحميل الماكينات');
      console.error('Error loading machines:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadMachines(searchQuery, statusFilter, currentPage);
  }, [ready, loadMachines, searchQuery, statusFilter, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalMachines / ITEMS_PER_PAGE);

  const validateForm = (data: Record<string, FormDataEntryValue | null>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const name = data.name?.toString().trim();
    const serial_number = data.serial_number?.toString().trim();
    const power_consumption = data.power_consumption?.toString();
    const status = data.status?.toString();
    if (!name) errors.name = 'اسم الماكينة مطلوب';
    else if (name.length < 2) errors.name = 'اسم الماكينة يجب أن يكون حرفين على الأقل';
    if (!serial_number) errors.serial_number = 'الرقم التسلسلي مطلوب';
    if (power_consumption && isNaN(Number(power_consumption))) errors.power_consumption = 'الطاقة يجب أن تكون رقماً';
    if (!status) errors.status = 'الحالة مطلوبة';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormErrors({});
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'), serial_number: formData.get('serial_number'),
      purchase_date: formData.get('purchase_date'), status: formData.get('status'),
      power_consumption: formData.get('power_consumption'), price: formData.get('price'),
      useful_life_years: formData.get('useful_life_years'), notes: formData.get('notes'),
    };
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    try {
      if (editingMachine) {
        const updated = await api.fetchWithAuth<Machine>(`/manufacturing/machines/${editingMachine.id}`, {
          method: 'PUT', body: JSON.stringify(data),
        });
        setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...updated } : m));
      } else {
        const created = await api.fetchWithAuth<Machine>('/manufacturing/machines', {
          method: 'POST', body: JSON.stringify(data),
        });
        setMachines(prev => [created, ...prev]);
        setTotalMachines(prev => prev + 1);
      }
      setShowModal(false);
      setEditingMachine(null);
      setFormError(null);
      setFormErrors({});
      toast.success(editingMachine ? 'تم تحديث الماكينة بنجاح' : 'تم إضافة الماكينة بنجاح');
    } catch (error: unknown) {
      const err = error as Error & { data?: unknown };
      const errorData = err.data;
      let errorMessage = 'حدث خطأ أثناء حفظ الماكينة. تأكد من الاتصال بالخادم.';
      if (errorData && typeof errorData === 'object') {
        const payload = errorData as { message?: string; error?: string };
        if (payload.message) errorMessage = payload.message;
        else if (payload.error) errorMessage = payload.error;
      }
      setFormError(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-200';
      case 'MAINTENANCE': return 'bg-yellow-500/20 text-yellow-200';
      case 'BROKEN': return 'bg-red-500/20 text-red-200';
      default: return 'bg-gray-500/20 text-gray-200';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'نشطة';
      case 'MAINTENANCE': return 'صيانة';
      case 'BROKEN': return 'معطلة';
      case 'INACTIVE': return 'غير نشطة';
      default: return status;
    }
  };
  const getMaintenanceDays = (m: Machine): { days: number; isOverdue: boolean } | null => {
    if (!m.next_maintenance) return null;
    const nextDate = new Date(m.next_maintenance);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { days: Math.abs(diffDays), isOverdue: true };
    return { days: diffDays, isOverdue: false };
  };

  const overdueMachines = machines.filter(m => { const st = getMaintenanceDays(m); return st && st.isOverdue; });

  return {
    machines, totalMachines, overdueCount, loading, showModal, setShowModal,
    editingMachine, setEditingMachine, formError, setFormError, formErrors, setFormErrors,
    searchQuery, statusFilter, currentPage, setCurrentPage, totalPages,
    handleSearchChange, handleStatusChange, handleSubmit,
    loadMachines, getStatusColor, getStatusText, getMaintenanceDays, overdueMachines,
  };
}
