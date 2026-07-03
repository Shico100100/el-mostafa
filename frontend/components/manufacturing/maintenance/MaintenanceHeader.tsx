'use client';

import { Wrench } from 'lucide-react';

export function MaintenanceHeader({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          <Wrench /> إدارة الصيانة
        </h1>
        <p className="text-slate-400 mt-1">جدولة ومتابعة صيانة الماكينات والمعدات</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onAdd}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          + تسجيل صيانة جديدة
        </button>
        <button onClick={onBack}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10">
          رجوع
        </button>
      </div>
    </div>
  );
}
