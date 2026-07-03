'use client';

import { Package } from 'lucide-react';
import { TypeBadge } from '@/components/inventory2/Badge';
import type { Product } from '@/components/inventory2/bulk-prices/types';

interface Props {
  products: Product[];
  loading: boolean;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}

export function ProductPriceTable({ products, loading, selectedIds, onToggle }: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {loading ? (
        <div className="text-center text-slate-400 py-20">جاري التحميل...</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-4 w-12"></th>
              <th className="px-6 py-4 text-right text-white font-semibold text-sm">المنتج</th>
              <th className="px-6 py-4 text-right text-white font-semibold text-sm">النوع</th>
              <th className="px-6 py-4 text-right text-white font-semibold text-sm">سعر التكلفة</th>
              <th className="px-6 py-4 text-right text-white font-semibold text-sm">سعر البيع</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const price = Number(product.cost_price);
              const selling = Number(product.selling_price);
              return (
                <tr
                  key={product.id}
                  className={`border-t border-white/5 transition ${
                    selectedIds.has(product.id) ? 'bg-blue-600/10' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => onToggle(product.id)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-900/50"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{product.name}</span>
                    <div className="text-xs text-slate-500">{product.unit || 'قطعة'}</div>
                  </td>
                  <td className="px-6 py-4"><TypeBadge type={product.type} /></td>
                  <td className="px-6 py-4"><span className="text-white">{price.toFixed(2)} ج.م</span></td>
                  <td className="px-6 py-4"><span className="text-white">{selling.toFixed(2)} ج.م</span></td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>لا توجد منتجات</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
