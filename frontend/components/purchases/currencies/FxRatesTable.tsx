'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { FxRate } from '@/components/purchases/currencies/types';

interface FxRatesTableProps {
  fxRates: FxRate[];
}

export function FxRatesTable({ fxRates }: FxRatesTableProps) {
  return (
    <GlassPanel title="سجل أسعار الصرف (FX Rates)">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 text-sm">
            <th className="text-right px-6 py-4">العملة</th>
            <th className="text-center px-6 py-4">السعر (→ EGP)</th>
            <th className="text-center px-6 py-4">المبلغ المدفوع</th>
            <th className="text-center px-6 py-4">التاريخ</th>
            <th className="text-right px-6 py-4">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {fxRates.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">لا توجد أسعار صرف مسجلة</td></tr>
          ) : (
            fxRates.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4 text-gray-300">{r.currency?.code || `#${r.currency_id}`}</td>
                <td className="px-6 py-4 text-center text-white font-medium">{Number(r.rate_to_egp).toFixed(4)}</td>
                <td className="px-6 py-4 text-center text-gray-300">{r.amount_paid ? `${Number(r.amount_paid).toLocaleString()} EGP` : '—'}</td>
                <td className="px-6 py-4 text-center text-gray-300">{new Date(r.rate_date).toLocaleDateString('ar-EG')}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">{r.notes || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </GlassPanel>
  );
}
