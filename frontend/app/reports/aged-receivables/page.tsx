'use client';

import { useFinancialReports } from '@/hooks/reports/useFinancialReports';
import { Users, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface AgedReceivableItem {
  customer_name?: string;
  name?: string;
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90_plus?: number;
  total?: number;
}

export default function AgedReceivablesPage() {
  const h = useFinancialReports();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users className="w-8 h-8 text-emerald-400" />الحسابات المدينة المتأخرة</h1>
          {h.agedReceivables.length > 0 && <button onClick={() => exportElementToPdf('aged-receivables-content', 'aged-receivables')} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        <div id="aged-receivables-content" className="p-6 bg-[#0a0f0d] rounded-xl">
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                  <th className="py-3 px-4 text-right">العميل</th>
                  <th className="py-3 px-4 text-right">الحالي</th>
                  <th className="py-3 px-4 text-right">30 يوم</th>
                  <th className="py-3 px-4 text-right">60 يوم</th>
                  <th className="py-3 px-4 text-right">90+ يوم</th>
                  <th className="py-3 px-4 text-right">الإجمالي</th>
                </tr></thead>
                <tbody>
                  {h.agedReceivables.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-[#6b8378]">لا توجد حسابات مدينة</td></tr>
                  ) : h.agedReceivables.map((r: AgedReceivableItem, i: number) => (
                    <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                      <td className="py-3 px-4 text-white font-semibold">{r.customer_name || r.name || 'عميل'}</td>
                      <td className="py-3 px-4 text-green-400">{Number(r.current || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-yellow-400">{Number(r.days_30 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-orange-400">{Number(r.days_60 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-400">{Number(r.days_90_plus || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-white font-bold">{Number(r.total || 0).toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
