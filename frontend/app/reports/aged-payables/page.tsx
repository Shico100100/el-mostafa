'use client';

import { useFinancialReports } from '@/hooks/reports/useFinancialReports';
import { Building2, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface AgedPayableItem {
  supplier_name?: string;
  name?: string;
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90_plus?: number;
  total?: number;
}

export default function AgedPayablesPage() {
  const h = useFinancialReports();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Building2 className="w-8 h-8 text-purple-400" />الحسابات الدائنة المتأخرة</h1>
          {h.agedPayables.length > 0 && <button onClick={() => exportElementToPdf('aged-payables-content', 'aged-payables')} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-lg border border-purple-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        <div id="aged-payables-content" className="p-6 bg-slate-900 rounded-xl">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-white/10">
                  <th className="py-3 px-4 text-right">المورد</th>
                  <th className="py-3 px-4 text-right">الحالي</th>
                  <th className="py-3 px-4 text-right">30 يوم</th>
                  <th className="py-3 px-4 text-right">60 يوم</th>
                  <th className="py-3 px-4 text-right">90+ يوم</th>
                  <th className="py-3 px-4 text-right">الإجمالي</th>
                </tr></thead>
                <tbody>
                  {h.agedPayables.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">لا توجد حسابات دائنة</td></tr>
                  ) : h.agedPayables.map((p: AgedPayableItem, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white font-semibold">{p.supplier_name || p.name || 'مورد'}</td>
                      <td className="py-3 px-4 text-green-400">{Number(p.current || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-yellow-400">{Number(p.days_30 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-orange-400">{Number(p.days_60 || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-400">{Number(p.days_90_plus || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-white font-bold">{Number(p.total || 0).toLocaleString()} ج.م</td>
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
