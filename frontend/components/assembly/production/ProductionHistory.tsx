'use client';

import { History } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { H2 } from '@/components/ui/Typography';
import type { AssemblyOrder } from '@/components/assembly/production/types';

interface ProductionHistoryProps {
  history: AssemblyOrder[];
  loading: boolean;
}

export function ProductionHistory({ history, loading }: ProductionHistoryProps) {
  return (
    <div className="mt-8">
      <GlassPanel className="p-6">
        <H2 className="flex items-center gap-2 mb-4 text-lg text-gray-300">
          <History size={20} /> آخر عمليات الإنتاج
        </H2>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">جاري التحميل...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">لا توجد عمليات إنتاج مسجلة بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-3 pr-2">#</th>
                  <th className="pb-3">المنتج</th>
                  <th className="pb-3 text-center">الكمية</th>
                  <th className="pb-3 text-center">التاريخ</th>
                  <th className="pb-3 text-center">التكلفة</th>
                  <th className="pb-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.slice(0, 20).map((o) => (
                  <tr key={o.id} className="hover:bg-white/5 transition">
                    <td className="py-3 pr-2 text-gray-400 font-mono text-sm">#{o.id}</td>
                    <td className="py-3 font-medium">{o.bom?.product?.name || o.bom?.name || '—'}</td>
                    <td className="py-3 text-center font-bold">{Number(o.quantity_produced).toLocaleString()}</td>
                    <td className="py-3 text-center text-gray-400">{new Date(o.date).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 text-center text-emerald-400">{Number(o.total_cost).toLocaleString()} ج.م</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        o.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {o.status === 'COMPLETED' ? 'مكتمل' : o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
