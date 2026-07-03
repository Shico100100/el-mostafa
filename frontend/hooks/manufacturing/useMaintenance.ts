'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Machine, MaintenanceLog } from '@/components/manufacturing/maintenance/types';

export function useMaintenance() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    machine_id: '',
    type: 'SCHEDULED',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    status: 'PENDING',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [machinesData, logsData] = await Promise.all([
        api.fetchWithAuth('/manufacturing/machines'),
        api.fetchWithAuth('/manufacturing/maintenance'),
      ]);
      setMachines(sortAlphabetically(machinesData, 'name'));
      setMaintenanceLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/manufacturing/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          machine_id: Number(formData.machine_id),
          cost: formData.cost ? Number(formData.cost) : 0,
        }),
      });
      setShowModal(false);
      loadData();
      setFormData({
        machine_id: '',
        type: 'SCHEDULED',
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        status: 'PENDING',
        notes: '',
      });
      toast.success('تم تسجيل الصيانة');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الصيانة');
    }
  };

  const getOverdueCount = () => {
    const today = new Date();
    return machines.filter(m => m.next_maintenance && new Date(m.next_maintenance) < today).length;
  };

  const getUpcomingCount = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return machines.filter(m =>
      m.next_maintenance &&
      new Date(m.next_maintenance) >= today &&
      new Date(m.next_maintenance) <= nextWeek
    ).length;
  };

  return {
    machines, maintenanceLogs, loading, showModal, setShowModal, formData, setFormData,
    loadData, handleSubmit, getOverdueCount, getUpcomingCount,
  };
}
