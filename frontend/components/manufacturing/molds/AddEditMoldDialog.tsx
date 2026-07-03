'use client';

import { useState, useEffect } from 'react';
import type { Mold, Product } from '@/components/manufacturing/molds/types';

interface AddEditMoldDialogProps {
  visible: boolean;
  editingMold: Mold | null;
  products: Product[];
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export function AddEditMoldDialog({ visible, editingMold, products, onSave, onClose }: AddEditMoldDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [productId, setProductId] = useState('');
  const [productWeight, setProductWeight] = useState('');
  const [cavities, setCavities] = useState('');
  const [maxShots, setMaxShots] = useState('');
  const [status, setStatus] = useState('GOOD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setName(editingMold?.name || '');
      setPrice(editingMold?.price?.toString() || '');
      setProductId(editingMold?.product_id?.toString() || '');
      setProductWeight(editingMold?.product_weight?.toString() || '');
      setCavities(editingMold?.cavities?.toString() || '');
      setMaxShots(editingMold?.max_shots?.toString() || '1000000');
      setStatus(editingMold?.status || 'GOOD');
      setNotes(editingMold?.notes || '');
    }
  }, [visible, editingMold]);

  if (!visible) return null;

  const toNumber = (v: string) => {
    if (v === '') return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      product_id: toNumber(productId) ?? null,
      price: toNumber(price),
      product_weight: toNumber(productWeight),
      cavities: toNumber(cavities),
      max_shots: toNumber(maxShots),
      status,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">{editingMold ? 'تعديل إسطمبة' : 'إضافة إسطمبة جديدة'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">اسم الإسطمبة</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">سعر الإسطمبة (ج.م)</label>
            <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">المنتج (اختياري)</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="">اختر المنتج (اختياري)</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">يمكنك ربط الإسطمبة بمنتج نهائي إذا وجد</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">وزن المنتج (جرام)</label>
            <input type="number" step="0.001" min="0" value={productWeight} onChange={e => setProductWeight(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">عدد العيون (Cavities)</label>
            <input type="number" min="1" value={cavities} onChange={e => setCavities(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">العمر الافتراضي (عدد الضربات)</label>
            <input type="number" min="1" value={maxShots} onChange={e => setMaxShots(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الحالة</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="GOOD">سليمة</option>
              <option value="NEEDS_REPAIR">تحتاج صيانة</option>
              <option value="MAINTENANCE">تحت الصيانة</option>
              <option value="BROKEN">معطلة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">
              {editingMold ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
