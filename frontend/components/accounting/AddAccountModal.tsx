'use client';

import { X } from 'lucide-react';

interface Props {
  show: boolean;
  code: string;
  name: string;
  type: string;
  description: string;
  onClose: () => void;
  onCodeChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddAccountModal({
  show, code, name, type, description, onClose,
  onCodeChange, onNameChange, onTypeChange, onDescriptionChange, onSubmit,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">إضافة حساب جديد</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">كود الحساب</label>
            <input type="text" value={code} onChange={(e) => onCodeChange(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">اسم الحساب</label>
            <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">نوع الحساب</label>
            <select value={type} onChange={(e) => onTypeChange(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="ASSET">أصول (ASSET)</option>
              <option value="LIABILITY">خصوم (LIABILITY)</option>
              <option value="EQUITY">حقوق ملكية (EQUITY)</option>
              <option value="REVENUE">إيرادات (REVENUE)</option>
              <option value="EXPENSE">مصروفات (EXPENSE)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">وصف</label>
            <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={2}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
