'use client';

import { Factory, Calculator, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SemiFinishedProduct } from '@/components/inventory2/types';

interface SemiFinishedSummaryProps {
  semiFinished: SemiFinishedProduct[];
  sfTotalValue: number;
  sfTop: SemiFinishedProduct[];
  sfMaxValue: number;
}

export function SemiFinishedSummary({ semiFinished, sfTotalValue, sfTop, sfMaxValue }: SemiFinishedSummaryProps) {
  const router = useRouter();
  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl"><Factory className="w-5 h-5 text-amber-400" /></div>
          <h2 className="text-lg font-bold text-white">مخزن البلاستيك</h2>
        </div>
        <button onClick={() => router.push('/inventory2/semi-finished')}
          className="text-sm text-amber-400 hover:text-amber-300 transition flex items-center gap-1">
          التفاصيل <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/5 rounded-xl p-4 border border-amber-500/15">
          <p className="text-xs text-slate-400">إجمالي المنتجات</p>
          <p className="text-2xl font-black text-white mt-1">{semiFinished.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/5 rounded-xl p-4 border border-amber-500/15">
          <p className="text-xs text-slate-400">القيمة الإجمالية</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{sfTotalValue.toLocaleString()} <span className="text-xs font-normal text-[#ecfdf5]0">ج.م</span></p>
        </div>
      </div>
      <div className="space-y-3">
        {sfTop.length === 0 && <p className="text-[#ecfdf5]0 text-center py-4 text-sm">لا توجد منتجات بلاستيكية بعد</p>}
        {sfTop.map((sf) => {
          const val = Number(sf.cost_price) * Number(sf.stock_quantity);
          const pct = (val / sfMaxValue) * 100;
          return (
            <button key={sf.id} onClick={() => router.push(`/inventory2/semi-finished/${sf.id}`)}
              className="w-full group text-right">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Calculator className="w-4 h-4 text-amber-400/70 shrink-0" />
                  <span className="text-sm text-white truncate">{sf.name}</span>
                </div>
                <span className="text-sm font-bold text-white shrink-0 mr-2">{Number(sf.stock_quantity).toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-l from-amber-500 to-orange-500 rounded-full transition-all duration-500 opacity-60 group-hover:opacity-100"
                  style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
