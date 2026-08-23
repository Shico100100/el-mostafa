'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { Truck, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface ShipmentItem {
  purchase_order_id: number;
  supplier_name: string;
  order_date: string;
  total_amount: number;
  total_landed_cost: number;
  sales_revenue: number;
  total_cogs: number;
  gross_profit: number;
  net_profit: number;
  margin_percent: number;
}

interface ShipmentSummary {
  total_shipments: number;
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  overall_margin_percent: number;
}

export default function ShipmentProfitabilityPage() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ shipments: ShipmentItem[]; summary: ShipmentSummary } | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(sixMonthsAgo);
  const [endDate, setEndDate] = useState(today);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getShipmentProfitability(startDate, endDate);
      setData(res);
    } catch {} finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => {
    if (ready) loadData();
  }, [ready, loadData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Truck className="w-8 h-8 text-blue-400" />ربحية الشحنات</h1>
          {data && <button onClick={() => exportElementToPdf('shipment-profit-content', 'shipment-profitability')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="text-sm text-[#6b8378] block mb-1">من تاريخ</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-[#1f2d26] bg-[#121a16] px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-sm text-[#6b8378] block mb-1">إلى تاريخ</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-[#1f2d26] bg-[#121a16] px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={loadData} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 transition">تحديث</button>
          </div>
        </div>

        <div id="shipment-profit-content" className="space-y-6">
          {/* Summary */}
          {s && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                <p className="text-[#6b8378] text-sm">عدد الشحنات</p>
                <p className="text-2xl font-bold text-white mt-1">{s.total_shipments}</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                <p className="text-[#6b8378] text-sm">الإيرادات</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{s.total_revenue?.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                <p className="text-[#6b8378] text-sm">التكلفة</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{s.total_cogs?.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                <p className="text-[#6b8378] text-sm">صافي الربح</p>
                <p className={`text-2xl font-bold mt-1 ${(s.total_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{s.total_profit?.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                <p className="text-[#6b8378] text-sm">هامش الربح</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{s.overall_margin_percent?.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                  <th className="py-3 px-4 text-right">شحنة #</th>
                  <th className="py-3 px-4 text-right">المورد</th>
                  <th className="py-3 px-4 text-right">التاريخ</th>
                  <th className="py-3 px-4 text-right">الإيرادات</th>
                  <th className="py-3 px-4 text-right">التكلفة</th>
                  <th className="py-3 px-4 text-right">صافي الربح</th>
                  <th className="py-3 px-4 text-right">الهامش</th>
                </tr></thead>
                <tbody>
                  {!data?.shipments?.length ? (
                    <tr><td colSpan={7} className="py-12 text-center text-[#6b8378]">لا توجد شحنات</td></tr>
                  ) : data.shipments.map((sh, i) => (
                    <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                      <td className="py-3 px-4 text-white font-semibold">#{sh.purchase_order_id}</td>
                      <td className="py-3 px-4 text-[#ecfdf5]">{sh.supplier_name}</td>
                      <td className="py-3 px-4 text-[#6b8378]">{sh.order_date ? new Date(sh.order_date).toLocaleDateString('ar-EG') : '-'}</td>
                      <td className="py-3 px-4 text-emerald-400">{sh.sales_revenue?.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 text-amber-400">{sh.total_cogs?.toLocaleString()} ج.م</td>
                      <td className={`py-3 px-4 font-bold ${(sh.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{sh.net_profit?.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4 text-blue-400">{sh.margin_percent?.toFixed(1)}%</td>
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
