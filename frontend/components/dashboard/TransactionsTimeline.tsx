/* eslint-disable @typescript-eslint/no-explicit-any */

import { ClipboardList } from 'lucide-react';

export function TransactionsTimeline({ sales, purchases }: { sales?: any[]; purchases?: any[] }) {
  const latest = [
    ...(sales || []).map((s: any) => ({ ...s, type: 'sale' as const, ref: s.customer?.name || `أمر بيع #${s.id}` })),
    ...(purchases || []).map((p: any) => ({ ...p, type: 'purchase' as const, ref: p.supplier?.name || `أمر شراء #${p.id}` })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  if (latest.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base"><ClipboardList /></span>
        <h4 className="text-xs font-bold text-slate-300">آخر المعاملات</h4>
      </div>
      <div className="space-y-0">
        {latest.map((item, idx) => {
          const isSale = item.type === 'sale';
          const dotColor = isSale ? 'bg-emerald-500' : 'bg-emerald-500';
          const label = isSale ? 'بيع' : 'شراء';
          const amount = Number(item.total_amount || 0).toLocaleString();
          return (
            <div key={`${item.type}-${item.id}`} className="flex gap-3 group/tx">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-slate-900 mt-1.5 group-hover/tx:scale-125 transition-transform`} />
                {idx < latest.length - 1 && <div className="w-px flex-1 bg-white/5 group-hover/tx:bg-white/10 transition-colors" />}
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.ref}</p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs font-bold text-slate-300 tabular-nums">{amount}</span>
                    <p className={`text-[9px] ${isSale ? 'text-emerald-600' : 'text-blue-600'}`}>{label}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
