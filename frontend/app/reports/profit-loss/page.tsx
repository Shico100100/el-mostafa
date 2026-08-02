'use client';

import { useFinancialReports } from '@/hooks/reports/useFinancialReports';
import { TrendingUp, TrendingDown, DollarSign, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

export default function ProfitLossPage() {
  const h = useFinancialReports();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const pl = h.profitLoss;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><DollarSign className="w-8 h-8 text-green-400" />قائمة الدخل</h1>
          {pl && <button onClick={() => exportElementToPdf('profit-loss-content', 'profit-loss')} className="bg-green-600/20 hover:bg-green-600/30 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        {!pl ? (
          <p className="text-gray-500 text-center py-12">لا توجد بيانات متاحة</p>
        ) : (
          <div id="profit-loss-content" className="p-6 bg-slate-900 rounded-xl space-y-8">
            {/* Period */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
              <span className="text-gray-400">الفترة:</span>
              <span className="text-white font-bold mr-2">{pl.period?.start}</span>
              <span className="text-gray-400 mr-2">إلى</span>
              <span className="text-white font-bold">{pl.period?.end}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />الإيرادات</h2>
                {pl.revenue?.items?.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">لا توجد إيرادات</p>
                ) : (
                  <div className="space-y-3">
                    {pl.revenue?.items?.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-300">{r.code} - {r.name}</span>
                        <span className="text-green-400 font-bold">{Number(r.balance || 0).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-green-500/30">
                      <span className="text-white font-bold">إجمالي الإيرادات</span>
                      <span className="text-green-400 font-bold text-xl">{Number(pl.revenue?.total || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-400" />المصروفات</h2>
                {pl.expenses?.items?.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">لا توجد مصروفات</p>
                ) : (
                  <div className="space-y-3">
                    {pl.expenses?.items?.map((e: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-300">{e.code} - {e.name}</span>
                        <span className="text-red-400 font-bold">{Number(e.balance || 0).toLocaleString()} ج.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-red-500/30">
                      <span className="text-white font-bold">إجمالي المصروفات</span>
                      <span className="text-red-400 font-bold text-xl">{Number(pl.expenses?.total || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">صافي الربح</span>
                <span className={`font-bold text-2xl ${pl.is_profit ? 'text-green-400' : 'text-red-400'}`}>
                  {Number(pl.net_profit || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="mt-2 text-center">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${pl.is_profit ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {pl.is_profit ? 'ربح' : 'خسارة'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
