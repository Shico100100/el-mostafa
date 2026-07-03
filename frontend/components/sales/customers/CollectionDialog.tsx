'use client';

import { useState } from 'react';
import type { Customer } from '@/components/sales/customers/types';

interface CollectionDialogProps {
  visible: boolean;
  customer: Customer | null;
  onSave: (data: { amount: number; payment_date: string | null; notes: string }) => void;
  onClose: () => void;
}

export function CollectionDialog({ visible, customer, onSave, onClose }: CollectionDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ amount: Number(amount), payment_date: paymentDate, notes });
    setAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">تحصيل مبلغ من: {customer?.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">المبلغ (جنيه)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات (طريقة الدفع/رقم الشيك)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700">
              تسجيل المبلغ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
