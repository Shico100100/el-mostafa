'use client';

import type { PurchaseReturn } from '@/components/purchases/returns/types';

interface ReturnsTableProps {
  returns: PurchaseReturn[];
  loading: boolean;
}

export function ReturnsTable({ returns, loading }: ReturnsTableProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -z-10 rounded-full" />
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-[0.2em] border-b border-white/10">
            <th className="px-6 py-5">رقم المرتجع</th>
            <th className="px-6 py-5">المورد</th>
            <th className="px-6 py-5">التاريخ</th>
            <th className="px-6 py-5">المبلغ الإجمالي</th>
            <th className="px-6 py-5">ملاحظات/سبب</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic animate-pulse">جاري تحميل البيانات...</td></tr>
          ) : returns.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic">لا توجد سجلات مرتجعات حالياً</td></tr>
          ) : (
            returns.map((ret) => (
              <tr key={ret.id} className="hover:bg-amber-500/5 transition group">
                <td className="px-6 py-4 font-mono text-amber-500 font-black">RET-P-{ret.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-bold">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    {ret.supplier?.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 font-medium">{new Date(ret.return_date).toLocaleDateString('ar-EG')}</td>
                <td className="px-6 py-4 font-black text-white">{Number(ret.total_amount).toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate italic">{ret.reason || 'لا يوجد'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
