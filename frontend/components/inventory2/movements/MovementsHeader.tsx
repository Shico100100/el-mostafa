'use client';

import { ArrowLeft } from 'lucide-react';

interface MovementsHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
}

export function MovementsHeader({ onBack, onRefresh }: MovementsHeaderProps) {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">حركات المخزون</h1>
            <p className="text-sm text-slate-400 mt-1">سجل جميع حركات الإضافة والصرف والتسوية</p>
          </div>
        </div>
        <button onClick={onRefresh}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition text-sm">
          تحديث
        </button>
      </div>
    </header>
  );
}
