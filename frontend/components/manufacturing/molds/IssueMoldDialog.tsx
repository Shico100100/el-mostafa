'use client';

import { useState } from 'react';

interface IssueMoldDialogProps {
  visible: boolean;
  moldName: string;
  onSave: (description: string, file: File | null) => void;
  onClose: () => void;
}

export function IssueMoldDialog({ visible, moldName, onSave, onClose }: IssueMoldDialogProps) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(description, file);
    setDescription('');
    setFile(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-2">تسجيل مشكلة في الإسطمبة</h2>
        <p className="text-gray-400 text-sm mb-6">{moldName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">وصف المشكلة</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="اشرح المشكلة بالتفصيل..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">صورة المشكلة (اختياري)</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700">
              تسجيل المشكلة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
