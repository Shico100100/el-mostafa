'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { PayrollProfile, CalculationResult, PayrollPayment } from '@/components/hr/payroll/types';

export function usePayroll() {
  const [activeTab, setActiveTab] = useState('PROFILES');
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [profiles, setProfiles] = useState<PayrollProfile[]>([]);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [payments, setPayments] = useState<PayrollPayment[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PayrollProfile | null>(null);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await api.getPayrollProfiles();
      setProfiles(data || []);
    } catch {
      toast.error('فشل تحميل بيانات الرواتب');
    }
  }, []);

  const loadCalculation = useCallback(async () => {
    try {
      const data = await api.calculatePayroll({ month });
      setCalculationResults(data || []);
    } catch {
      toast.error('فشل حساب الرواتب');
    }
  }, [month]);

  const loadPayments = useCallback(async () => {
    try {
      const data = await api.getPayrollPayments();
      setPayments(data || []);
    } catch {
      toast.error('فشل تحميل سجل الصرف');
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'PROFILES') loadProfiles();
    if (tab === 'CALCULATION') loadCalculation();
    if (tab === 'HISTORY') loadPayments();
  };

  const handleProfileSave = async (data: { user_id: number; base_salary: number; working_hours_per_day: number; overtime_rate: number; deduction_rate: number }) => {
    try {
      await api.updatePayrollProfile(data.user_id, data);
      setShowProfileModal(false);
      toast.success('تم حفظ إعدادات الراتب');
      loadProfiles();
    } catch {
      toast.error('فشل حفظ إعدادات الراتب');
    }
  };

  const handleConfirmPayment = async (result: CalculationResult) => {
    try {
      await api.savePayrollPayment({
        user_id: result.user.id,
        month: result.month,
        base_salary: result.baseSalary,
        attendance_days: result.attendanceDays,
        absent_days: result.absentDays,
        deductions: result.deductions,
        net_salary: result.netSalary,
        status: 'PAID',
        payment_date: new Date().toISOString().split('T')[0],
      });
      toast.success(`تم صرف راتب ${result.user.firstName}`);
      loadCalculation();
    } catch {
      toast.error('فشل تأكيد الصرف');
    }
  };

  return {
    activeTab, month, setMonth,
    profiles, calculationResults, payments,
    showProfileModal, setShowProfileModal, editingProfile, setEditingProfile,
    loadProfiles, loadCalculation, loadPayments,
    handleTabChange, handleProfileSave, handleConfirmPayment,
  };
}
