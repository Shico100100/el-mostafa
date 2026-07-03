'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBatchModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    product_id: '',
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    quantity: '',
    unit: 'piece',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity) return;
    setSaving(true);
    try {
      await api.createBatch({
        product_id: Number(form.product_id),
        production_date: form.production_date,
        expiry_date: form.expiry_date || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        notes: form.notes || undefined,
      });
      toast.success('تم إنشاء الدفعة بنجاح');
      onCreated();
    } catch {
      toast.error('فشل إنشاء الدفعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-lg border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">إنشاء دفعة جديدة</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">رقم المنتج</label>
            <input type="number" value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">تاريخ الإنتاج</label>
              <input type="date" value={form.production_date}
                onChange={(e) => setForm({ ...form, production_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">تاريخ انتهاء الصلاحية</label>
              <input type="date" value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">الكمية</label>
              <input type="number" step="any" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">الوحدة</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition">
                <option value="piece">قطعة</option>
                <option value="kg">كجم</option>
                <option value="box">كرتونة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition" rows={2} />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition">إلغاء</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition font-bold disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
