'use client';

import { Eye, DollarSign, Printer, ClipboardList } from 'lucide-react';
import type { Order, Filters } from './types';

export function SalesOrdersTable({
  orders, loading, filters, totalPages, totalItems,
  onPageChange, onOpenDetails, onDuplicate, onOpenPayment, onPrint,
}: {
  orders: Order[];
  loading: boolean;
  filters: Filters;
  totalPages: number;
  totalItems: number;
  onPageChange: (filters: Filters) => void;
  onOpenDetails: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onOpenPayment: (order: Order) => void;
  onPrint: (order: Order) => void;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm">التاريخ</th>
              <th className="px-6 py-4 font-semibold text-sm">العميل</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">المبلغ</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">رقم الفاتورة</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">حالة التسليم</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">جاري التحميل...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">لا توجد أوامر بيع حالياً</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{order.customer?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-blue-400">
                      {Number(order.total_amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 mr-1">ج.م</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-bold">#{order.id}</span>
                    {order.notes?.match(/^\[PQ-/) && (
                      <span className="mr-2 inline-block px-2 py-0.5 rounded-full bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs font-semibold align-middle">
                        Peachtree
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {order.delivered_at ? (
                      <span
                        className="inline-block px-2.5 py-1 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                        title={`تاريخ التسليم: ${new Date(order.delivered_at).toLocaleDateString('ar-EG')}`}
                      >
                        مسلّم
                      </span>
                    ) : order.status === 'COMPLETED' ? (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                        مكتمل
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-600/20 border border-slate-500/30 text-slate-300 text-xs font-semibold">
                        {order.status === 'CANCELLED' ? 'ملغي' : 'قيد التنفيذ'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenDetails(order)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(order)}
                        className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/40 transition"
                        title="نسخ الطلب"
                      >
                        <ClipboardList className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onOpenPayment(order)}
                        className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40 transition"
                        title="تسجيل دفعة"
                      >
                        <DollarSign className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onPrint(order)}
                        className="p-2 bg-slate-600/20 text-slate-400 rounded-lg hover:bg-slate-600/40 transition"
                        title="طباعة"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          عرض {orders.length} من {totalItems} أمر بيع
        </div>
        <div className="flex gap-2">
          <button
            disabled={filters.page === 1}
            onClick={() => onPageChange({ ...filters, page: filters.page - 1 })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 transition"
          >
            السابق
          </button>
          <span className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold">{filters.page} / {totalPages}</span>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => onPageChange({ ...filters, page: filters.page + 1 })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 transition"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
