'use client';

import { Trophy } from 'lucide-react';
import type { ShipmentProfit } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShipmentProfitTab({ shipmentProfit }: { shipmentProfit: { shipments: ShipmentProfit[]; summary: Record<string, any> } }) {
  const { summary, shipments } = shipmentProfit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="text-gray-400 text-sm mb-1">عدد الشحنات</div>
          <div className="text-3xl font-bold text-white">{summary.total_shipments as number}</div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="text-gray-400 text-sm mb-1">إجمالي الإيرادات</div>
          <div className="text-3xl font-bold text-blue-400">{(summary.total_revenue as number).toLocaleString()}</div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="text-gray-400 text-sm mb-1">تكلفة البضاعة</div>
          <div className="text-3xl font-bold text-orange-400">{(summary.total_cogs as number).toLocaleString()}</div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="text-gray-400 text-sm mb-1">صافي الربح</div>
          <div className={`text-3xl font-bold ${(summary.total_profit as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(summary.total_profit as number).toLocaleString()}
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="text-gray-400 text-sm mb-1">هامش الربح الإجمالي</div>
          <div className={`text-3xl font-bold ${(summary.overall_margin_percent as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(summary.overall_margin_percent as number).toFixed(1)}%
          </div>
        </div>
      </div>

      {(summary.highest_margin_items as Array<Record<string, unknown>>)?.length > 0 && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5" /> أعلى 5 منتجات هامش ربح</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="text-right px-4 py-3">المنتج</th>
                <th className="text-center px-4 py-3">الإيرادات</th>
                <th className="text-center px-4 py-3">التكلفة</th>
                <th className="text-center px-4 py-3">التكلفة الإضافية</th>
                <th className="text-center px-4 py-3">الربح</th>
                <th className="text-center px-4 py-3">هامش الربح</th>
              </tr>
            </thead>
            <tbody>
              {(summary.highest_margin_items as Array<Record<string, unknown>>).map((item: Record<string, unknown>, idx: number) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white font-medium">{item.product_name as string}</td>
                  <td className="px-4 py-3 text-center text-blue-400">{(item.revenue as number).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-orange-400">{(item.total_cogs as number).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-amber-400">{(item.landed_cost_allocated as number).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-center font-bold ${(item.profit as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(item.profit as number).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${(item.margin_percent as number) >= 20 ? 'bg-green-500/20 text-green-300' : (item.margin_percent as number) >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                      {(item.margin_percent as number).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-auto">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">جميع الشحنات</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-right px-4 py-3">الشحنة</th>
              <th className="text-right px-4 py-3">المورد</th>
              <th className="text-center px-4 py-3">التاريخ</th>
              <th className="text-center px-4 py-3">الإيرادات</th>
              <th className="text-center px-4 py-3">COGS</th>
              <th className="text-center px-4 py-3">التكلفة النهائية</th>
              <th className="text-center px-4 py-3">الربح الصافي</th>
              <th className="text-center px-4 py-3">الهامش</th>
              <th className="text-center px-4 py-3">مباع/مشترى</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.purchase_order_id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3 text-white font-medium">#{s.purchase_order_id}</td>
                <td className="px-4 py-3 text-gray-300">{s.supplier_name}</td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {s.order_date ? new Date(s.order_date).toLocaleDateString('ar-EG') : '—'}
                </td>
                <td className="px-4 py-3 text-center text-blue-400">{s.sales_revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-orange-400">{s.total_cogs.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-amber-400">{s.total_landed_cost.toLocaleString()}</td>
                <td className={`px-4 py-3 text-center font-bold ${s.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {s.net_profit.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${s.margin_percent >= 20 ? 'bg-green-500/20 text-green-300' : s.margin_percent >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                    {s.margin_percent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {s.total_items_sold}/{s.total_items_purchased}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shipments.map((s) => s.items.length > 0 && (
        <div key={s.purchase_order_id} className="bg-white/5 rounded-2xl border border-white/10 overflow-auto">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white">تفاصيل أصناف الشحنة #{s.purchase_order_id} — {s.supplier_name}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="text-right px-4 py-2">المنتج</th>
                <th className="text-center px-4 py-2">تم شراؤه</th>
                <th className="text-center px-4 py-2">تم بيعه</th>
                <th className="text-center px-4 py-2">تكلفة الوحدة</th>
                <th className="text-center px-4 py-2">إجمالي COGS</th>
                <th className="text-center px-4 py-2">تكلفة إضافية</th>
                <th className="text-center px-4 py-2">الإيرادات</th>
                <th className="text-center px-4 py-2">الربح</th>
                <th className="text-center px-4 py-2">الهامش</th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((item) => (
                <tr key={item.product_id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-2 text-white">{item.product_name}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{item.quantity_purchased}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{item.quantity_sold}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{item.unit_cost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center text-orange-400">{item.total_cogs.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center text-amber-400">{item.landed_cost_allocated.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center text-blue-400">{item.revenue.toLocaleString()}</td>
                  <td className={`px-4 py-2 text-center font-bold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.profit.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.margin_percent >= 20 ? 'bg-green-500/20 text-green-300' : item.margin_percent >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                      {item.margin_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
