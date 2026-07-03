'use client';

import type { EditForm } from '@/components/manufacturing/entry-log/types';
import { Pencil } from 'lucide-react';

interface Props {
  show: boolean;
  editForm: EditForm;
  onFormChange: (f: EditForm) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function EditMovementDialog({ show, editForm, onFormChange, onSave, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Pencil /> تعديل سجل دخول</h2>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">التاريخ</label>
            <input type="date" required value={editForm.date}
              onChange={(e) => onFormChange({ ...editForm, date: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">الكمية</label>
            <input type="number" step="0.01" required dir="ltr" value={editForm.quantity}
              onChange={(e) => onFormChange({ ...editForm, quantity: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">السعر</label>
            <input type="number" step="0.01" dir="ltr" value={editForm.price}
              onChange={(e) => onFormChange({ ...editForm, price: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">ملاحظات</label>
            <textarea value={editForm.notes} onChange={(e) => onFormChange({ ...editForm, notes: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" rows={3} />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">حفظ التعديلات</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
