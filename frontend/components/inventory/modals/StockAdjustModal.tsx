'use client';

import { useState } from 'react';

interface StockAdjustModalProps {
  productId: number | null;
  onClose: () => void;
  onSave: (productId: number, data: { type: 'IN' | 'OUT'; quantity: string; notes: string }) => Promise<void>;
}

export default function StockAdjustModal({ productId, onClose, onSave }: StockAdjustModalProps) {
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (productId === null) return null;

  const handleSave = async () => {
    if (!quantity) return;
    setSaving(true);
    try {
      await onSave(productId, { type, quantity, notes });
      setQuantity('');
      setNotes('');
      setType('IN');
    } catch (e) {
      console.error('Stock adjustment failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-6">تسوية المخزون</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">نوع الحركة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'IN' | 'OUT')}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="IN">إضافة إلى المخزون</option>
              <option value="OUT">خصم من المخزون</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">الكمية</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="أدخل الكمية"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="سبب التعديل..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition" disabled={saving}>إلغاء</button>
            <button onClick={handleSave} disabled={saving || !quantity} className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 font-bold disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
