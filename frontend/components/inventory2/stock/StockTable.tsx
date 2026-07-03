'use client';

import { Package } from 'lucide-react';
import { StockBadge } from '@/components/inventory2/Badge';
import type { StockItem } from '@/components/inventory2/stock/types';

interface Props {
  items: StockItem[];
  warehousesCount: number;
  onTransfer: (item: StockItem) => void;
}

export function StockTable({ items, warehousesCount, onTransfer }: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-right text-white font-semibold text-sm">المنتج</th>
            <th className="px-6 py-4 text-right text-white font-semibold text-sm">المخزن</th>
            <th className="px-6 py-4 text-right text-white font-semibold text-sm">الكمية</th>
            <th className="px-6 py-4 text-right text-white font-semibold text-sm">الحالة</th>
            <th className="px-6 py-4 text-center text-white font-semibold text-sm">تحويل</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const qty = Number(item.quantity);
            const pid = item.product_id || item.product?.id;
            return (
              <tr key={`${item.warehouse_id}-${pid}-${index}`} className="border-t border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{item.product?.name || `منتج #${pid}`}</div>
                  {item.product?.sku && <div className="text-xs text-slate-500 mt-0.5">SKU: {item.product.sku}</div>}
                </td>
                <td className="px-6 py-4 text-slate-300">{item.warehouse?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className="text-lg font-bold text-white">{qty.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 mr-1">{item.product?.unit || 'قطعة'}</span>
                </td>
                <td className="px-6 py-4"><StockBadge quantity={qty} /></td>
                <td className="px-6 py-4 text-center">
                  {qty > 0 && warehousesCount > 1 && (
                    <button onClick={() => onTransfer(item)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-sm transition inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> تحويل
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>لا توجد بيانات مخزون</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
