'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, FileDown, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { exportElementToPdf } from '@/lib/pdf-reports';

export default function SalesByCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async (sd?: string, ed?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sd) params.set('startDate', sd);
      if (ed) params.set('endDate', ed);
      const result = await api.fetchWithAuth<any>(`/reports/sales-by-customer?${params}`);
      setData(result);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router]);

  const exportCsv = () => {
    if (!data?.customers?.length) return;
    const header = 'العميل,عدد الطلبات,الإجمالي,أول طلب,آخر طلب\n';
    const rows = data.customers.map((c: any) =>
      `${c.customer_name},${c.order_count},${c.total_amount},${c.first_order || ''},${c.last_order || ''}`
    ).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-by-customer-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-400" />مبيعات حسب العميل
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div>
              <label className="block text-gray-300 text-sm mb-1">من تاريخ</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">إلى تاريخ</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
            <button onClick={() => loadData(startDate || undefined, endDate || undefined)}
              className="px-6 py-2 h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold">
              عرض
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv}
              className="px-4 py-2 h-[42px] bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2">
              <Download className="w-4 h-4" />تصدير CSV
            </button>
            <button onClick={() => exportElementToPdf('sales-by-customer-content', 'sales-by-customer')}
              className="px-4 py-2 h-[42px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 transition flex items-center gap-2">
              <FileDown className="w-4 h-4" />تصدير PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><span className="text-white text-xl">جاري التحميل...</span></div>
        ) : (
          <div id="sales-by-customer-content" className="p-6 bg-slate-900 rounded-xl">
            {data?.period && (
              <p className="text-gray-400 text-sm mb-4">الفترة: {data.period.start} — {data.period.end}</p>
            )}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                      <th className="py-3 px-4 text-right">العميل</th>
                      <th className="py-3 px-4 text-right">عدد الطلبات</th>
                      <th className="py-3 px-4 text-right">الإجمالي</th>
                      <th className="py-3 px-4 text-right">أول طلب</th>
                      <th className="py-3 px-4 text-right">آخر طلب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data?.customers?.length ? (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-500">لا توجد بيانات مبيعات</td></tr>
                    ) : (
                      <>
                        {data.customers.map((c: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 px-4 text-white font-semibold">{c.customer_name}</td>
                            <td className="py-3 px-4 text-blue-400">{c.order_count}</td>
                            <td className="py-3 px-4 text-green-400 font-bold">{Number(c.total_amount).toLocaleString()} ج.م</td>
                            <td className="py-3 px-4 text-gray-300">{c.first_order ? new Date(c.first_order).toLocaleDateString('ar-EG') : '-'}</td>
                            <td className="py-3 px-4 text-gray-300">{c.last_order ? new Date(c.last_order).toLocaleDateString('ar-EG') : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/5 border-t border-white/20">
                          <td className="py-3 px-4 text-white font-bold">الإجمالي</td>
                          <td className="py-3 px-4 text-blue-400 font-bold">{data.customers.reduce((s: number, c: any) => s + c.order_count, 0)}</td>
                          <td className="py-3 px-4 text-green-400 font-bold text-lg">{Number(data.grand_total).toLocaleString()} ج.م</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
