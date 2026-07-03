'use client';

import { RotateCcw, Truck } from 'lucide-react';

interface PurchaseReturnsHeaderProps {
  onNewReturn: () => void;
}

export function PurchaseReturnsHeader({ onNewReturn }: PurchaseReturnsHeaderProps) {
  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent underline decoration-amber-500/20 underline-offset-8">
          مرتجعات المشتريات
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm flex items-center gap-2">
          <Truck className="w-4 h-4" />
          إدارة عمليات إعادة البضائع للموردين
        </p>
      </div>
      <button onClick={onNewReturn}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black transition shadow-lg shadow-amber-900/20 group">
        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition duration-500" />
        تسجيل مرتجع مشتريات
      </button>
    </header>
  );
}
