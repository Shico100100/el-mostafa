'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { usePermission } from '@/lib/usePermission';
import { toast } from 'sonner';
import type { User, UserForm } from '@/components/users/types';

const emptyForm = (): UserForm => ({
  email: '', password: '', firstName: '', lastName: '',
  role: { id: 2 }, status: { id: 1 },
});

export function useUsers() {
  const router = useRouter();
  const { isAdmin } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [formData, setFormData] = useState<UserForm>(emptyForm());
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) { router.push('/dashboard'); return; }
    loadUsers();
  }, [isAdmin, loading, router, loadUsers]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      toast.success(editingUser ? 'تم تحديث المستخدم' : 'تم إنشاء المستخدم');
      setShowRegisterDialog(false);
      setEditingUser(null);
      setFormData(emptyForm());
      loadUsers();
    } catch {
      toast.error('خطأ في حفظ البيانات');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteUser(id);
      toast.success('تم حذف المستخدم');
      loadUsers();
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName || '',
      role: { id: user.role.id },
      status: { id: user.status.id },
    });
    setShowRegisterDialog(true);
  };

  const startNew = () => {
    setEditingUser(null);
    setFormData(emptyForm());
    setShowRegisterDialog(true);
  };

  if (loading) return { loading: true, users: [], showRegisterDialog: false, editingUser: null, formData: emptyForm(), handleSave, handleDelete, startEdit, startNew, setShowRegisterDialog, setFormData };

  return {
    loading, users, showRegisterDialog, setShowRegisterDialog,
    editingUser, formData, setFormData,
    handleSave, handleDelete, startEdit, startNew,
  };
}
