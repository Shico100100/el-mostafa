'use client';

import { Package, AlertTriangle, AlertOctagon, DollarSign } from 'lucide-react';

interface RawMaterialsStatsProps {
  total: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export function RawMaterialsStats({ total, lowStock, outOfStock, totalValue }: RawMaterialsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">إجمالي المواد</p>
            <p className="text-3xl font-bold text-white mt-1">{total}</p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-xl"><Package /></div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">مخزون منخفض</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{lowStock}</p>
          </div>
          <div className="p-3 bg-yellow-500/20 rounded-xl"><AlertTriangle /></div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">نفذ المخزون</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{outOfStock}</p>
          </div>
          <div className="p-3 bg-red-500/20 rounded-xl"><AlertOctagon /></div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">قيمة المخزون</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{totalValue.toFixed(2)} ج.م</p>
          </div>
          <div className="p-3 bg-green-500/20 rounded-xl"><DollarSign /></div>
        </div>
      </div>
    </div>
  );
}
