'use client';

import { ArrowRightLeft, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { StockMovement } from '@/components/inventory2/types';

const movementIcons: Record<string, string> = { IN: 'و', OUT: 'ص', ADJUST: 'ت' };
const movementColors: Record<string, string> = {
  IN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  OUT: 'bg-red-500/20 text-red-300 border-red-500/30',
  ADJUST: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export function RecentMovements({ movements }: { movements: StockMovement[] }) {
  const router = useRouter();
  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl"><ArrowRightLeft className="w-5 h-5 text-blue-400" /></div>
          <h2 className="text-lg font-bold text-white">آخر الحركات</h2>
        </div>
        <button onClick={() => router.push('/inventory2/stock/movements')}
          className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
          سجل كامل <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-0">
        {movements.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد حركات بعد</p>}
        {movements.map((m, i) => (
          <div key={m.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border ${movementColors[m.type] || 'bg-slate-700 text-slate-300'}`}>
                {movementIcons[m.type] || '?'}
              </span>
              {i < movements.length - 1 && <div className="w-px flex-1 bg-white/5 my-1" />}
            </div>
            <div className="flex-1 pb-5 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium truncate">{m.product?.name || `منتج #${m.product_id}`}</p>
                <span className={`text-sm font-bold shrink-0 mr-2 ${m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.type === 'IN' ? '+' : '-'}{Number(m.quantity).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{m.notes || m.reference_type || (
                m.date ? new Date(m.date).toLocaleDateString('ar-EG') : m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : ''
              )}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
