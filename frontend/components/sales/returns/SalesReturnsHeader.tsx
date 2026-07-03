'use client';

import { RotateCcw } from 'lucide-react';

interface Props {
  onNewReturn: () => void;
}

export function SalesReturnsHeader({ onNewReturn }: Props) {
  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
          مرتجعات المبيعات
        </h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">إدارة عمليات الإرجاع واسترداد المخزون</p>
      </div>
      <button
        onClick={onNewReturn}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg shadow-rose-900/40"
      >
        <RotateCcw className="w-5 h-5" />
        تسجيل مرتجع جديد
      </button>
    </header>
  );
}
