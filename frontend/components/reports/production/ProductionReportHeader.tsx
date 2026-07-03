'use client';

import { Factory } from 'lucide-react';

export function ProductionReportHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Factory className="w-6 h-6" /> تقرير الإنتاج</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
        >
          العودة للتقارير
        </button>
      </div>
    </header>
  );
}
