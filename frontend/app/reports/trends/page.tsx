'use client';

import { useState, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface TrendItem {
  month: string;
  sales: number;
  purchases: number;
  production?: number;
}

export default function TrendsPage() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendItem[]>([]);

  useEffect(() => {
    if (!ready) return;
    api.getTrends().then((res) => {
      setData(Array.isArray(res) ? res : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.purchases, d.production || 0)), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><TrendingUp className="w-8 h-8 text-emerald-400" />الاتجاهات الشهرية</h1>
          {data.length > 0 && <button onClick={() => exportElementToPdf('trends-content', 'trends')} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2"><BarChart3 className="w-4 h-4" />تصدير PDF</button>}
        </div>

        <div id="trends-content" className="space-y-6">
          {data.length === 0 ? (
            <p className="text-[#6b8378] text-center py-12">لا توجد بيانات متاحة</p>
          ) : (
            <>
              {/* Legend */}
              <div className="flex gap-6 justify-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[#ecfdf5]">المبيعات</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-[#ecfdf5]">المشتريات</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[#ecfdf5]">الإنتاج</span></div>
              </div>

              {/* Bar Chart */}
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
                <div className="flex items-end gap-2 h-64">
                  {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="flex gap-0.5 items-end w-full" style={{ height: '100%' }}>
                        <div className="flex-1 rounded-t bg-emerald-500/80 transition-all hover:bg-emerald-400" style={{ height: `${(d.sales / maxVal) * 100}%` }} title={`مبيعات: ${d.sales.toLocaleString()}`} />
                        <div className="flex-1 rounded-t bg-amber-500/80 transition-all hover:bg-amber-400" style={{ height: `${(d.purchases / maxVal) * 100}%` }} title={`مشتريات: ${d.purchases.toLocaleString()}`} />
                        {(d.production ?? 0) > 0 && <div className="flex-1 rounded-t bg-blue-500/80 transition-all hover:bg-blue-400" style={{ height: `${((d.production || 0) / maxVal) * 100}%` }} title={`إنتاج: ${d.production?.toLocaleString()}`} />}
                      </div>
                      <span className="text-xs text-[#6b8378] whitespace-nowrap">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                    <th className="py-3 px-4 text-right">الشهر</th>
                    <th className="py-3 px-4 text-right">المبيعات</th>
                    <th className="py-3 px-4 text-right">المشتريات</th>
                    <th className="py-3 px-4 text-right">الإنتاج</th>
                    <th className="py-3 px-4 text-right">صافي</th>
                  </tr></thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                        <td className="py-3 px-4 text-white font-semibold">{d.month}</td>
                        <td className="py-3 px-4 text-emerald-400">{d.sales.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-amber-400">{d.purchases.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-blue-400">{(d.production || 0).toLocaleString()}</td>
                        <td className={`py-3 px-4 font-bold ${d.sales - d.purchases >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(d.sales - d.purchases).toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
