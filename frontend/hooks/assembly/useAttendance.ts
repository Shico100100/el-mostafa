'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AttendanceRecord, Worker } from '@/components/assembly/attendance/types';

export function useAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceData, workersData] = await Promise.all([
        api.getAttendance(),
        api.getWorkers(),
      ]);
      setAttendance(attendanceData || []);
      setWorkers(workersData || []);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingRecord?.id,
      user_id: Number(formData.get('user_id')),
      date,
      status: formData.get('status') as string,
      check_in: (formData.get('check_in') as string) || null,
      check_out: (formData.get('check_out') as string) || null,
      notes: formData.get('notes') as string,
    };

    try {
      await api.saveAttendance(data);
      toast.success('تم حفظ البيانات');
      setShowModal(false);
      setEditingRecord(null);
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAttendance(id);
      toast.success('تم الحذف');
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const openNew = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const openEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  return {
    date, setDate, attendance, workers, loading,
    showModal, editingRecord,
    handleSave, handleDelete, openNew, openEdit, closeModal,
  };
}
