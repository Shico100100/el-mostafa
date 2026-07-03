'use client';

import type { ReportData, Sale } from '../types';

export function ProfitLossTab({ data }: { data: ReportData }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
          <h3 className="text-blue-200 mb-2">إجمالي الإيرادات</h3>
          <p className="text-2xl font-bold text-white">{Number(data.totalSales).toLocaleString()} ج.م</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
          <h3 className="text-amber-200 mb-2">تكلفة البضاعة المباعة (COGS)</h3>
          <p className="text-2xl font-bold text-white">{Number(data.totalCOGS).toLocaleString()} ج.م</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
          <h3 className="text-emerald-200 mb-2">إجمالي الربح (Gross Profit)</h3>
          <p className="text-2xl font-bold text-white">{Number(data.grossProfit).toLocaleString()} ج.م</p>
        </div>
        <div className={`${(data.netProfit || 0) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border p-6 rounded-2xl shadow-xl shadow-black/20`}>
          <h3 className={`${(data.netProfit || 0) >= 0 ? 'text-green-200' : 'text-red-200'} mb-2`}>صافي الربح</h3>
          <p className="text-2xl font-bold text-white">{Number(data.netProfit).toLocaleString()} ج.م</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">تحليل الأداء المالي</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-300">الإيرادات</span>
                <span className="text-white">{Number(data.totalSales).toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-amber-300">تكلفة البضاعة (COGS)</span>
                <span className="text-white">{Number(data.totalCOGS).toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(((data.totalCOGS || 0) / (data.totalSales || 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-red-300">المصاريف التشغيلية (Fixed Costs)</span>
                <span className="text-white">{Number(data.totalFixedCosts).toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(((data.totalFixedCosts || 0) / (data.totalSales || 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-6">
              <p className="text-gray-300">
                هامش الربح الإجمالي: <span className="text-emerald-400 font-bold">
                  {data.totalSales && data.totalSales > 0 ? (((data.grossProfit || 0) / data.totalSales) * 100).toFixed(1) : '0'}%
                </span>
              </p>
              <p className="text-gray-300">
                هامش الربح الصافي: <span className="text-blue-400 font-bold">
                  {data.totalSales && data.totalSales > 0 ? (((data.netProfit || 0) / data.totalSales) * 100).toFixed(1) : '0'}%
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">تفاصيل المبيعات والأرباح</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="sticky top-0 bg-slate-800 text-gray-400">
                <tr>
                  <th className="p-3">الأمر</th>
                  <th className="p-3">الإيراد</th>
                  <th className="p-3">التكلفة</th>
                  <th className="p-3">الربح</th>
                </tr>
              </thead>
              <tbody>
                {data.sales?.map((sale: Sale) => {
                  const saleCOGS = sale.items.reduce((sum: number, item) => sum + (Number(item.quantity) * Number(item.product.cost_price || 0)), 0);
                  const saleProfit = Number(sale.total_amount) - saleCOGS;
                  return (
                    <tr key={sale.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-3">#{sale.id}</td>
                      <td className="p-3">{Number(sale.total_amount).toLocaleString()}</td>
                      <td className="p-3 text-amber-400">{saleCOGS.toLocaleString()}</td>
                      <td className={`p-3 font-bold ${saleProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {saleProfit.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
