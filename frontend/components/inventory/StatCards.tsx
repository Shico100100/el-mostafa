'use client';

import { Package, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardDef {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

interface StatCardsProps {
  cards: StatCardDef[];
}

function StatCard({ label, value, icon, color }: StatCardDef) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );
}

export default function StatCards({ cards }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}

export function buildProductStats(products: { cost_price: number; selling_price: number; stock_quantity: number; min_stock?: number }[]) {
  const total = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * p.stock_quantity, 0);
  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.min_stock || 0)).length;
  const margins = products
    .filter((p) => p.cost_price > 0)
    .map((p) => ((p.selling_price - p.cost_price) / p.cost_price) * 100);
  const avgMargin = margins.length > 0
    ? margins.reduce((a, b) => a + b, 0) / margins.length
    : 0;

  return {
    total,
    totalStockValue,
    lowStockCount,
    avgMargin,
  };
}

export function productStatCards(stats: ReturnType<typeof buildProductStats>): StatCardDef[] {
  return [
    { label: 'إجمالي المنتجات', value: stats.total, icon: <Package className="w-6 h-6 text-blue-400" />, color: 'bg-blue-500/20' },
    { label: 'قيمة المخزون', value: stats.totalStockValue.toLocaleString(), icon: <DollarSign className="w-6 h-6 text-green-400" />, color: 'bg-green-500/20' },
    { label: 'متوسط هامش الربح', value: `${stats.avgMargin.toFixed(1)}%`, icon: <Percent className="w-6 h-6 text-amber-400" />, color: 'bg-amber-500/20' },
    { label: 'منتجات ناقصة', value: stats.lowStockCount, icon: <AlertTriangle className="w-6 h-6 text-red-400" />, color: 'bg-red-500/20' },
  ];
}
