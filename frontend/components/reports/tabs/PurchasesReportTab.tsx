'use client';

import type { ReportData, Purchase } from '../types';
import { Pagination } from '@/components/Pagination';

export function PurchasesReportTab({ data, page, totalPages, onPageChange }: { data: ReportData; page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
          <h3 className="text-purple-200 mb-2">إجمالي المشتريات</h3>
          <p className="text-3xl font-bold text-white">{Number(data.totalPurchases).toFixed(2)} ج.م</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
          <h3 className="text-purple-200 mb-2">عدد الطلبات</h3>
          <p className="text-3xl font-bold text-white">{data.purchasesCount}</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">التاريخ</th>
              <th className="p-4">المورد</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {data.purchases?.map((order: Purchase) => (
              <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                <td className="p-4">{order.supplier?.name}</td>
                <td className="p-4">{Number(order.total_amount).toFixed(2)}</td>
                <td className="p-4">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={data.purchasesCount || 0}
        showingItems={data.purchases?.length || 0}
        onPageChange={onPageChange}
      />
    </>
  );
}
