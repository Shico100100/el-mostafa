'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReportData, ProductReportItem } from '../types';

export function StockReportTab({ data }: { data: ReportData }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
          <h3 className="text-green-200 mb-2">قيمة المخزون</h3>
          <p className="text-3xl font-bold text-white">{Number(data.totalValue).toFixed(2)} ج.م</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
          <h3 className="text-green-200 mb-2">عدد الأصناف</h3>
          <p className="text-3xl font-bold text-white">{data.productCount}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          <h3 className="text-red-200 mb-2">نواقص المخزون</h3>
          <p className="text-3xl font-bold text-white">{data.lowStockItems?.length || 0}</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">حركة المخزون الكاملة</h3>
        </div>
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">المنتج</th>
              <th className="p-4">الكمية الحالية</th>
              <th className="p-4">الوحدة</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {data.allProducts?.map((item: ProductReportItem) => (
              <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">{item.name}</td>
                <td className={`p-4 font-bold ${Number(item.quantity) <= Number(item.min_stock) ? 'text-red-400' : 'text-emerald-400'}`}>
                  {item.quantity}
                </td>
                <td className="p-4">{item.unit}</td>
                <td className="p-4 text-sm">
                  {Number(item.quantity) <= Number(item.min_stock) ? <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> ناقص</span> : <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> متوفر</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
