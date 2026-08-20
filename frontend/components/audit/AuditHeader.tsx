'use client';

import { ArrowLeft } from 'lucide-react';

export function AuditHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex justify-between items-center mb-10">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            سجل العمليات (Audit Log)
          </h1>
          <p className="text-[#ecfdf5]0 mt-1 font-medium text-sm">تتبع كافة التحركات والتغييرات في النظام</p>
        </div>
      </div>
    </header>
  );
}
