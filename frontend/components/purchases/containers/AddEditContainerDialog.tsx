'use client';

import { X } from 'lucide-react';

interface AddEditContainerDialogProps {
  visible: boolean;
  isEdit: boolean;
  form: { name: string; length_cm: string; width_cm: string; height_cm: string; max_weight_kg: string; notes: string };
  onFormChange: (form: { name: string; length_cm: string; width_cm: string; height_cm: string; max_weight_kg: string; notes: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function AddEditContainerDialog({ visible, isEdit, form, onFormChange, onSave, onClose }: AddEditContainerDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'تعديل الحاوية' : 'حاوية جديدة'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>الاسم (مثال: 20 قدم)</label>
            <input className={inputClass} value={form.name} onChange={e => onFormChange({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>الطول (سم)</label>
              <input className={inputClass} type="number" value={form.length_cm} onChange={e => onFormChange({ ...form, length_cm: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>العرض (سم)</label>
              <input className={inputClass} type="number" value={form.width_cm} onChange={e => onFormChange({ ...form, width_cm: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>الارتفاع (سم)</label>
              <input className={inputClass} type="number" value={form.height_cm} onChange={e => onFormChange({ ...form, height_cm: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>الوزن الأقصى (كجم)</label>
            <input className={inputClass} type="number" value={form.max_weight_kg} onChange={e => onFormChange({ ...form, max_weight_kg: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>ملاحظات</label>
            <input className={inputClass} value={form.notes} onChange={e => onFormChange({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
            <button onClick={onSave} className={`px-4 py-2 rounded-lg border transition ${isEdit ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'}`}>
              {isEdit ? 'تحديث' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
