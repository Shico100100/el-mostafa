'use client';

import { Package, Box, Factory, AlertTriangle, type LucideIcon } from 'lucide-react';

interface HeroStat {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  from: string;
  via: string;
  to: string;
  text: string;
}

export function HeroStatsGrid({ stats }: { stats: HeroStat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((card) => (
        <div key={card.label}
          className="relative group bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 overflow-hidden hover:border-white/20 transition-all duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${card.from} ${card.via} ${card.to} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="text-3xl font-black text-white mt-1">{card.value}</p>
              <p className="text-xs text-[#ecfdf5]0 mt-1">{card.sub}</p>
            </div>
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${card.text}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.from} ${card.via} ${card.to} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right`} />
        </div>
      ))}
    </div>
  );
}

export function useHeroStats(
  totalProducts: number,
  totalStockAll: number,
  sfTotalStock: number,
  sfTotalValue: number,
  lowStockCount: number,
  outOfStockCount: number,
): HeroStat[] {
  return [
    { label: 'إجمالي المنتجات', value: totalProducts, sub: 'منتج', icon: Package, from: 'from-blue-600', via: 'via-emerald-500', to: 'to-cyan-500', text: 'text-blue-400' },
    { label: 'إجمالي القطع', value: totalStockAll.toLocaleString(), sub: 'قطعة', icon: Box, from: 'from-emerald-600', via: 'via-emerald-500', to: 'to-teal-500', text: 'text-emerald-400' },
    { label: 'مخزن البلاستيك', value: sfTotalStock.toLocaleString(), sub: `${sfTotalValue.toLocaleString()} ج.م`, icon: Factory, from: 'from-amber-600', via: 'via-amber-500', to: 'to-orange-500', text: 'text-amber-400' },
    { label: 'تنبيهات', value: lowStockCount + outOfStockCount, sub: `${outOfStockCount} نفذ · ${lowStockCount} محدود`, icon: AlertTriangle, from: 'from-red-600', via: 'via-red-500', to: 'to-rose-500', text: 'text-red-400' },
  ];
}
