'use client';

import { useState, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { ClipboardList, FileDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface StockProduct {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock?: number;
  category?: string;
}

interface StockReport {
  totalValue: number;
  productCount: number;
  lowStockItems: StockProduct[];
  allProducts: StockProduct[];
}

export default function StockReportPage() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StockReport | null>(null);

  useEffect(() => {
    if (!ready) return;
    api.getStockReport().then((res) => {
      setData(res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const products = data?.allProducts || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><ClipboardList className="w-8 h-8 text-emerald-400" />تقرير المخزون</h1>
          {data && <button onClick={() => exportElementToPdf('stock-report-content', 'stock-report')} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        <div id="stock-report-content" className="space-y-6">
          {(!data || products.length === 0) ? (
            <p className="text-[#6b8378] text-center py-12">لا توجد بيانات متاحة</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                  <p className="text-[#6b8378] text-sm">عدد المنتجات</p>
                  <p className="text-2xl font-bold text-white mt-1">{data.productCount}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                  <p className="text-[#6b8378] text-sm">قيمة المخزون الإجمالية</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{data.totalValue?.toLocaleString()} ج.م</p>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
                  <p className="text-[#6b8378] text-sm">منتجات مخزونها منخفض</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{data.lowStockItems?.length || 0}</p>
                </div>
              </div>

              {/* Low Stock Alert */}
              {data.lowStockItems && data.lowStockItems.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h3 className="text-red-400 font-bold flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5" />منتجات مخزونها منخفض</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {data.lowStockItems.map((p) => (
                      <div key={p.id} className="bg-black/30 rounded-lg p-2">
                        <p className="text-white text-sm font-semibold">{p.name}</p>
                        <p className="text-red-400 text-xs">المخزون: {p.quantity} {p.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                      <th className="py-3 px-4 text-right">المنتج</th>
                      <th className="py-3 px-4 text-right">الكمية</th>
                      <th className="py-3 px-4 text-right">الوحدة</th>
                      <th className="py-3 px-4 text-right">سعر التكلفة</th>
                      <th className="py-3 px-4 text-right">سعر البيع</th>
                      <th className="py-3 px-4 text-right">القيمة</th>
                      <th className="py-3 px-4 text-right">الحالة</th>
                    </tr></thead>
                    <tbody>
                      {products.map((p) => {
                        const lowStock = p.min_stock && p.quantity <= p.min_stock;
                        return (
                          <tr key={p.id} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                            <td className="py-3 px-4 text-white font-semibold">{p.name}</td>
                            <td className="py-3 px-4 text-[#ecfdf5]">{p.quantity}</td>
                            <td className="py-3 px-4 text-[#6b8378]">{p.unit}</td>
                            <td className="py-3 px-4 text-amber-400">{Number(p.cost_price).toLocaleString()} ج.م</td>
                            <td className="py-3 px-4 text-emerald-400">{Number(p.selling_price).toLocaleString()} ج.م</td>
                            <td className="py-3 px-4 text-white font-bold">{(p.quantity * Number(p.cost_price)).toLocaleString()} ج.م</td>
                            <td className="py-3 px-4">
                              {lowStock ? (
                                <span className="flex items-center gap-1 text-red-400 text-xs"><AlertTriangle className="w-3 h-3" />منخفض</span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" />متوفر</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
