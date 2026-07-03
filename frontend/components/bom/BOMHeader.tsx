'use client';

import { ClipboardList } from 'lucide-react';

interface BOMHeaderProps {
  bomsCount: number;
  totalComponents: number;
  bomProductsCount: number;
  productsCount: number;
  onBack: () => void;
  onCreate: () => void;
}

export function BOMHeader({ bomsCount, totalComponents, bomProductsCount, productsCount, onBack, onCreate }: BOMHeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-6 h-6" /> قائمة المكونات (BOM)</h1>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">
            العودة للرئيسية
          </button>
          <button onClick={onCreate} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition">
            + BOM جديد
          </button>
        </div>
      </div>
      <div className="container mx-auto px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-emerald-400">{bomsCount}</div>
            <div className="text-sm text-gray-400">إجمالي BOM</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-blue-400">{totalComponents}</div>
            <div className="text-sm text-gray-400">إجمالي المكونات</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-purple-400">{bomProductsCount}</div>
            <div className="text-sm text-gray-400">منتجات نهائية</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-amber-400">{productsCount}</div>
            <div className="text-sm text-gray-400">إجمالي المنتجات</div>
          </div>
        </div>
      </div>
    </header>
  );
}
