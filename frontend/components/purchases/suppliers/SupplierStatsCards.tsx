'use client';

import type { Supplier } from '@/components/purchases/suppliers/types';

interface SupplierStatsCardsProps {
  suppliers: Supplier[];
}

export function SupplierStatsCards({ suppliers }: SupplierStatsCardsProps) {
  const totalBalance = suppliers.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);
  const avgDebt = suppliers.length > 0
    ? (suppliers.reduce((sum, s) => sum + Number(s.balance), 0) / suppliers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-purple-600/20 border border-teal-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-purple-200 text-sm font-medium mb-2">إجمالي الموردين</h3>
        <p className="text-3xl font-bold text-white">{suppliers.length}</p>
      </div>
      <div className="bg-pink-600/20 border border-pink-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-pink-200 text-sm font-medium mb-2">موردين لهم مستحقات</h3>
        <p className="text-3xl font-bold text-white">{suppliers.filter(s => Number(s.balance) > 0).length}</p>
      </div>
      <div className="bg-amber-600/20 border border-amber-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-amber-200 text-sm font-medium mb-2">إجمالي المستحقات</h3>
        <p className="text-3xl font-bold text-white">{totalBalance.toLocaleString()}</p>
        <span className="text-xs text-amber-300">جنيه مصري</span>
      </div>
      <div className="bg-blue-600/20 border border-emerald-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-blue-200 text-sm font-medium mb-2">متوسط المديونية</h3>
        <p className="text-3xl font-bold text-white">{avgDebt}</p>
        <span className="text-xs text-blue-300">جنيه / مورد</span>
      </div>
    </div>
  );
}
