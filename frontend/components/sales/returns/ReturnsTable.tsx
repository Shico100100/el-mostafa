'use client';

import type { SalesReturn } from '@/components/sales/returns/types';

interface Props {
  returns: SalesReturn[];
  loading: boolean;
}

export function ReturnsTable({ returns, loading }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">المرتجع #</th>
            <th className="px-6 py-4">العميل</th>
            <th className="px-6 py-4">التاريخ</th>
            <th className="px-6 py-4">المبلغ</th>
            <th className="px-6 py-4">السبب</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">جاري تحميل البيانات...</td></tr>
          ) : returns.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">لا توجد مرتجعـات مسجلة</td></tr>
          ) : (
            returns.map((ret) => (
              <tr key={ret.id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-4 font-mono text-rose-400 font-bold">#{ret.id}</td>
                <td className="px-6 py-4 font-bold">{ret.customer?.name}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(ret.return_date).toLocaleDateString('ar-EG')}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">{Number(ret.total_amount).toLocaleString()} ج.م</td>
                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{ret.reason || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
