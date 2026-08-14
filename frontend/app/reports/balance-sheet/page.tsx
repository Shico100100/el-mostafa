'use client';

import { useFinancialReports } from '@/hooks/reports/useFinancialReports';
import { Landmark, TrendingUp, TrendingDown, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface BalanceSheetLine {
  account_name?: string;
  name?: string;
  balance?: number;
  amount?: number;
}

interface BalanceSheetReport {
  assets?: BalanceSheetLine[];
  liabilities?: BalanceSheetLine[];
  equity?: BalanceSheetLine[];
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
}

export default function BalanceSheetPage() {
  const h = useFinancialReports();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const bs = h.balanceSheet as BalanceSheetReport | null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Landmark className="w-8 h-8 text-amber-400" />الميزان العمومي</h1>
          {bs && <button onClick={() => exportElementToPdf('balance-sheet-content', 'balance-sheet')} className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 px-4 py-2 rounded-lg border border-amber-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        {!bs ? (
          <p className="text-gray-500 text-center py-12">لا توجد بيانات متاحة</p>
        ) : (
          <div id="balance-sheet-content" className="p-6 bg-slate-900 rounded-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assets */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />الأصول</h2>
                {bs.assets?.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">لا توجد أصول</p>
                ) : (
                  <div className="space-y-3">
                    {bs.assets?.map((a: BalanceSheetLine, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-300">{a.account_name || a.name}</span>
                        <span className="text-green-400 font-bold">{Number(a.balance || a.amount).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-green-500/30">
                      <span className="text-white font-bold">إجمالي الأصول</span>
                      <span className="text-green-400 font-bold text-xl">{Number(bs.total_assets || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Liabilities + Equity */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-400" />الخصوم وحقوق الملكية</h2>
                {bs.liabilities?.length === 0 && bs.equity?.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {bs.liabilities?.map((l: BalanceSheetLine, i: number) => (
                      <div key={`l-${i}`} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-300">{l.account_name || l.name}</span>
                        <span className="text-red-400 font-bold">{Number(l.balance || l.amount).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                    {bs.equity?.map((e: BalanceSheetLine, i: number) => (
                      <div key={`e-${i}`} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-300">{e.account_name || e.name}</span>
                        <span className="text-amber-400 font-bold">{Number(e.balance || e.amount).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-red-500/30">
                      <span className="text-white font-bold">إجمالي الخصوم + الملكية</span>
                      <span className="text-red-400 font-bold text-xl">{Number((bs.total_liabilities || 0) + (bs.total_equity || 0)).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
