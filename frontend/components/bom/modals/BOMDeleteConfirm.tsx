'use client';

import type { BOM } from '../types';

interface BOMDeleteConfirmProps {
  bom: BOM;
  onClose: () => void;
  onConfirm: () => void;
}

export function BOMDeleteConfirm({ bom, onClose, onConfirm }: BOMDeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h2>
        <p className="text-gray-300 mb-6">
          هل أنت متأكد من حذف BOM: <span className="text-white font-bold">{bom.name}</span>؟
          <br />
          <span className="text-red-400 text-sm">هذا الإجراء لا يمكن التراجع عنه.</span>
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[#ecfdf5]0/20 text-gray-300 rounded-lg hover:bg-[#ecfdf5]0/30 transition">إلغاء</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition">حذف</button>
        </div>
      </div>
    </div>
  );
}
