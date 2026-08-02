'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { User } from '@/components/settings/types';

export function useSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadUser();
  }, [router]);

  const loadUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData || null);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await api.createBackup();
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
    } catch {
      toast.error('فشل إنشاء النسخة الاحتياطية');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setNewPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreLoading(true);
    try {
      await api.restoreBackup(file);
      toast.success('تم استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل الصفحة.');
      window.location.reload();
    } catch {
      toast.error('فشل استعادة النسخة الاحتياطية');
    } finally {
      setRestoreLoading(false);
      e.target.value = '';
    }
  };

  const handleFactoryReset = async () => {
    setResetLoading(true);
    try {
      await api.resetSystem();
      toast.success('تم إعادة تعيين النظام بنجاح. سيتم تسجيل الخروج.');
      api.clearAuth();
      window.location.href = '/login';
    } catch {
      toast.error('فشل إعادة تعيين النظام.');
      setResetLoading(false);
    }
  };

  const handleSyncMolds = async () => {
    setSyncLoading(true);
    try {
      const result = await api.syncMolds();
      toast.success(`تمت المزامنة بنجاح! تم معالجة ${result.processed_molds} إسطمبة.`);
    } catch {
      toast.error('فشل عملية المزامنة');
    } finally {
      setSyncLoading(false);
    }
  };

  return {
    loading, user,
    showPasswordModal, setShowPasswordModal, newPassword, setNewPassword,
    currentPassword, setCurrentPassword, confirmPassword, setConfirmPassword,
    backupLoading, restoreLoading, resetLoading, syncLoading,
    handleBackup, handleChangePassword, handleRestore, handleFactoryReset, handleSyncMolds,
  };
}
