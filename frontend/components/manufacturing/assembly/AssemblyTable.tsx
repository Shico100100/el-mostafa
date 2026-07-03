'use client';

import type { AssemblyOrder } from '@/components/manufacturing/assembly/types';

interface Props { orders: AssemblyOrder[] }

export function AssemblyTable({ orders }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
            <th className="px-6 py-4 text-right text-white font-semibold">المنتج</th>
            <th className="px-6 py-4 text-right text-white font-semibold">الكمية المنتجة</th>
            <th className="px-6 py-4 text-right text-white font-semibold">التكلفة الإجمالية</th>
            <th className="px-6 py-4 text-right text-white font-semibold">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-6 py-4 text-gray-300">{new Date(order.date).toLocaleDateString('ar-EG')}</td>
              <td className="px-6 py-4 text-gray-200 font-semibold">{order.bom?.product?.name}</td>
              <td className="px-6 py-4 text-gray-300">{order.quantity_produced}</td>
              <td className="px-6 py-4 text-gray-300">{Number(order.total_cost).toFixed(2)} جنيه</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded text-sm">مكتمل</span>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">لا توجد أوامر تجميع سابقة.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
