'use client';

import { Plus, Factory } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryHeaderProps {
  totalProducts: number;
  semiFinishedCount: number;
  totalStockAll: number;
}

export function InventoryHeader({ totalProducts, semiFinishedCount, totalStockAll }: InventoryHeaderProps) {
  const router = useRouter();
  return (
    <header className="bg-gradient-to-l from-slate-900 via-blue-900/20 to-slate-900 border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">لوحة تحكم المخزون</h1>
          <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {totalProducts} منتج | {semiFinishedCount} بلاستيك | {totalStockAll.toLocaleString()} قطعة
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/inventory/products')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/30">
            <Plus className="w-5 h-5" /> إضافة منتج
          </button>
          <button onClick={() => router.push('/inventory/semi-finished')}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-amber-900/30">
            <Factory className="w-5 h-5" /> مخزن البلاستيك
          </button>
        </div>
      </div>
    </header>
  );
}
