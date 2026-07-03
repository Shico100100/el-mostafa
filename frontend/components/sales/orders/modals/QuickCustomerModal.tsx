'use client';

import { X } from 'lucide-react';

export function QuickCustomerModal({
  show, data, setData, onSubmit, onClose,
}: {
  show: boolean;
  data: { name: string; phone: string; email: string; address: string };
  setData: (data: { name: string; phone: string; email: string; address: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">إضافة عميل جديد سريع</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input placeholder="اسم العميل *" required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition" />
          <input placeholder="رقم الهاتف" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/40">حفظ العميل</button>
        </form>
      </div>
    </div>
  );
}
