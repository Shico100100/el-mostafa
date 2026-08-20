'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function StockAdjustModal({ productId, onClose, onSave }: {
  productId: number | null; onClose: () => void;
  onSave: (productId: number, data: { type: 'IN' | 'OUT'; quantity: string; notes: string }) => Promise<void>;
}) {
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (productId === null) return null;

  const handleSave = async () => {
    if (!quantity || Number(quantity) <= 0) return;
    setSaving(true);
    try {
      await onSave(productId, { type, quantity, notes });
      setQuantity(''); setNotes(''); setType('IN');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">تسوية المخزون</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">نوع الحركة</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'IN' | 'OUT')}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
              <option value="IN">إضافة إلى المخزون</option>
              <option value="OUT">خصم من المخزون</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">الكمية</label>
            <input type="number" min="0.01" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" placeholder="أدخل الكمية" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">ملاحظات (اختياري)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" placeholder="سبب التعديل..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition" disabled={saving}>إلغاء</button>
            <button onClick={handleSave} disabled={saving || !quantity || Number(quantity) <= 0}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 shadow-lg shadow-cyan-900/20">
              {saving ? 'جاري...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
