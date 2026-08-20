'use client';

import { AlertTriangle, Eye, Package, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AlertsPanelProps {
  outOfStockCount: number;
  lowStockCount: number;
}

export function AlertsPanel({ outOfStockCount, lowStockCount }: AlertsPanelProps) {
  const router = useRouter();
  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-500/20 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
        <h2 className="text-lg font-bold text-white">التنبيهات والإجراءات</h2>
      </div>
      <div className="space-y-3">
        {outOfStockCount > 0 && (
          <div className="p-4 bg-gradient-to-l from-red-900/30 to-red-800/10 rounded-xl border border-red-500/20 flex items-center justify-between">
            <div>
              <p className="text-red-300 font-bold">{outOfStockCount} منتجات نفذت بالكامل</p>
              <p className="text-xs text-slate-400 mt-0.5">يجب إعادة التزويد فوراً</p>
            </div>
            <span className="text-2xl font-black text-red-400">{outOfStockCount}</span>
          </div>
        )}
        {lowStockCount > 0 && (
          <div className="p-4 bg-gradient-to-l from-amber-900/30 to-amber-800/10 rounded-xl border border-amber-500/20 flex items-center justify-between">
            <div>
              <p className="text-amber-300 font-bold">{lowStockCount} منتجات في حد الخطر</p>
              <p className="text-xs text-slate-400 mt-0.5">الكمية أقل من الحد الأدنى</p>
            </div>
            <span className="text-2xl font-black text-amber-400">{lowStockCount}</span>
          </div>
        )}
        {outOfStockCount === 0 && lowStockCount === 0 && (
          <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/20 text-center">
            <p className="text-emerald-300 font-bold flex items-center gap-1">جميع المنتجات متوفرة بكميات جيدة <Check className="w-4 h-4" /></p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => router.push('/inventory/stock')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm text-slate-300 hover:text-white transition flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" /> المخزون الكامل
          </button>
          <button onClick={() => router.push('/inventory/products')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm text-slate-300 hover:text-white transition flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> إدارة المنتجات
          </button>
        </div>
      </div>
    </div>
  );
}
