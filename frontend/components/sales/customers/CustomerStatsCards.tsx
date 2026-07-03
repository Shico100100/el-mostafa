'use client';

import type { Customer } from '@/components/sales/customers/types';

interface CustomerStatsCardsProps {
  customers: Customer[];
}

export function CustomerStatsCards({ customers }: CustomerStatsCardsProps) {
  const totalDue = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
  const avgDebt = customers.length > 0
    ? (customers.reduce((sum, c) => sum + Number(c.balance), 0) / customers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-blue-200 text-sm font-medium mb-2">إجمالي العملاء</h3>
        <p className="text-3xl font-bold text-white">{customers.length}</p>
      </div>
      <div className="bg-green-600/20 border border-green-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-green-200 text-sm font-medium mb-2">عملاء عليهم مديونيات</h3>
        <p className="text-3xl font-bold text-white">{customers.filter(c => Number(c.balance) > 0).length}</p>
      </div>
      <div className="bg-amber-600/20 border border-amber-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-amber-200 text-sm font-medium mb-2">إجمالي الديون المستحقة</h3>
        <p className="text-3xl font-bold text-white">{totalDue.toLocaleString()}</p>
        <span className="text-xs text-amber-300">جنيه مصري</span>
      </div>
      <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <h3 className="text-purple-200 text-sm font-medium mb-2">متوسط المديونية</h3>
        <p className="text-3xl font-bold text-white">{avgDebt}</p>
        <span className="text-xs text-purple-300">جنيه / عميل</span>
      </div>
    </div>
  );
}
