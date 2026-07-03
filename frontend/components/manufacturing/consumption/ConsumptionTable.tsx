'use client';

import type { Consumption } from '@/components/manufacturing/consumption/types';

interface Props { items: Consumption[] }

export function ConsumptionTable({ items }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التاريخ</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">المادة الخام</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الكمية</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">سعر الوحدة</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التكلفة الإجمالية</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">المرجع</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">لا توجد سجلات استهلاك</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="text-gray-300">{new Date(c.consumed_at).toLocaleDateString('ar-EG')}</div>
                    <div className="text-xs text-gray-500">{new Date(c.consumed_at).toLocaleTimeString('ar-EG')}</div>
                  </td>
                  <td className="px-6 py-4"><div className="text-white font-medium">{c.raw_material.product.name}</div></td>
                  <td className="px-6 py-4"><div className="text-white font-semibold">{Number(c.quantity).toFixed(2)} {c.raw_material.product.unit}</div></td>
                  <td className="px-6 py-4"><div className="text-gray-300">{Number(c.cost_per_unit).toFixed(2)} ج.م</div></td>
                  <td className="px-6 py-4"><div className="text-green-400 font-semibold">{Number(c.total_cost).toFixed(2)} ج.م</div></td>
                  <td className="px-6 py-4">
                    <div className="text-gray-300">
                      {c.assembly_order ? `تجميع #${c.assembly_order.id}` : c.production ? `إنتاج #${c.production.id}` : 'يدوي'}
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="text-gray-400 text-sm">{c.notes || '-'}</div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
