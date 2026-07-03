'use client';

import { useState, useEffect } from 'react';
import type { Customer } from '@/components/sales/customers/types';

interface AddEditCustomerDialogProps {
  visible: boolean;
  editingCustomer: Customer | null;
  onSave: (data: { name: string; phone?: string; email?: string; address?: string }) => void;
  onClose: () => void;
}

export function AddEditCustomerDialog({ visible, editingCustomer, onSave, onClose }: AddEditCustomerDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (visible) {
      setName(editingCustomer?.name || '');
      setPhone(editingCustomer?.phone || '');
      setEmail(editingCustomer?.email || '');
      setAddress(editingCustomer?.address || '');
    }
  }, [visible, editingCustomer]);

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, email, address });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">{editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الاسم</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الهاتف</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">العنوان</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700">
              {editingCustomer ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
