'use client';

import type { ConsumptionStats } from '@/components/manufacturing/consumption/types';
import { FileText, DollarSign, Package } from 'lucide-react';

interface Props { stats: ConsumptionStats }

export function StatCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">إجمالي السجلات</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.totalConsumptions}</p>
          </div>
          <div className="p-3 bg-emerald-500/20 rounded-xl"><FileText /></div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">إجمالي التكلفة</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.totalCost.toFixed(2)} ج.م</p>
          </div>
          <div className="p-3 bg-green-500/20 rounded-xl"><DollarSign /></div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">إجمالي الكمية</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{stats.totalQuantity.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-teal-500/20 rounded-xl"><Package /></div>
        </div>
      </div>
    </div>
  );
}
