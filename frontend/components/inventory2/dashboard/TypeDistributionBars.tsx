'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { productTypeLabel } from '@/components/inventory2/types';
import type { TypeStats } from '@/hooks/inventory2/useInventory2Dashboard';

const typeBarColors: Record<string, string> = {
  FINISHED: 'bg-emerald-500',
  IMPORTED: 'bg-violet-500',
  RAW: 'bg-orange-500',
  PACKAGING: 'bg-sky-500',
  SEMI: 'bg-cyan-500',
};

interface TypeDistributionBarsProps {
  typeStats: TypeStats[];
  totalProducts: number;
  maxCount: number;
}

export function TypeDistributionBars({ typeStats, totalProducts, maxCount }: TypeDistributionBarsProps) {
  const router = useRouter();
  return (
    <div className="lg:col-span-3 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">توزيع المنتجات حسب النوع</h2>
        <button onClick={() => router.push('/inventory2/products')}
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1">
          الكل <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-4">
        {typeStats.map((stat) => {
          const pct = totalProducts > 0 ? ((stat.count / totalProducts) * 100).toFixed(1) : '0';
          return (
            <button key={stat.type}
              onClick={() => router.push(`/inventory2/products?type=${stat.type}`)}
              className="w-full group text-right">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-400 group-hover:text-white transition">{productTypeLabel(stat.type)}</span>
                <span className="text-sm text-[#ecfdf5]0">{stat.count} منتج ({pct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${typeBarColors[stat.type]} opacity-70 group-hover:opacity-100`}
                  style={{ width: `${(stat.count / maxCount) * 100}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
