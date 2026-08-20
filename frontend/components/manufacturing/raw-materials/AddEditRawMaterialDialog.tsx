'use client';

import { Pencil, Plus } from 'lucide-react';

interface AddEditRawMaterialDialogProps {
  visible: boolean;
  isEditing: boolean;
  formData: { name: string; unit: string; reorder_point: string };
  onFormDataChange: (data: { name: string; unit: string; reorder_point: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AddEditRawMaterialDialog({
  visible, isEditing, formData, onFormDataChange, onSubmit, onClose,
}: AddEditRawMaterialDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEditing ? <span className="flex items-center gap-2"><Pencil /> تعديل المادة الخام</span> : <span className="flex items-center gap-2"><Plus /> إضافة مادة خام جديدة</span>}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">اسم المادة الخام *</label>
            <input
              type="text" required value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="مثال: بلاستيك PP"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">الوحدة *</label>
            <select required value={formData.unit} onChange={(e) => onFormDataChange({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500">
              <option value="kg">كيلوجرام (kg)</option>
              <option value="ton">طن (ton)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">الحد الأدنى للطلب (Reorder Point) *</label>
            <input type="number" step="0.01" required value={formData.reorder_point}
              onChange={(e) => onFormDataChange({ ...formData, reorder_point: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="مثال: 100"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
              {isEditing ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg font-semibold transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
