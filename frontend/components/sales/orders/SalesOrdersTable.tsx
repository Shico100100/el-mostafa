'use client';

import { useState } from 'react';
import { Eye, DollarSign, Printer, ClipboardList, Truck, Ban, Trash2, Pencil, Undo2, MessageCircle, Receipt } from 'lucide-react';
import type { Order, Filters } from './types';

function DeliveryBadge({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold">
        ملغي
      </span>
    );
  }
  if (order.delivered_at) {
    return (
      <span
        className="inline-block px-2.5 py-1 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
        title={`تاريخ التسليم: ${new Date(order.delivered_at).toLocaleDateString('ar-EG')}`}
      >
        مسلّم
      </span>
    );
  }
  if (order.status === 'COMPLETED') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
        مكتمل
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full bg-slate-600/20 border border-slate-400/30 text-slate-300 text-xs font-semibold">
      قيد التنفيذ
    </span>
  );
}

export function SalesOrdersTable({
  orders, loading, filters, totalPages, totalItems,
  onPageChange, onOpenDetails, onDuplicate, onOpenPayment, onPrint, onReceipt,
  onDeliver, onCancel, onDelete, onEdit, onReturn, onShare,
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
  onReceipt: (order: Order) => void;
  onDeliver: (order: Order) => void;
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  onReturn: (order: Order) => void;
  onShare: (order: Order) => void;
}) {
  // Two-step confirm for destructive actions: first click arms, second executes.
  const [armed, setArmed] = useState<{ id: number; action: 'cancel' | 'delete' } | null>(null);

  const armOrFire = (order: Order, action: 'cancel' | 'delete') => {
    if (armed?.id === order.id && armed.action === action) {
      setArmed(null);
      if (action === 'cancel') onCancel(order);
      else onDelete(order);
    } else {
      setArmed({ id: order.id, action });
      setTimeout(() => setArmed((a) => (a?.id === order.id && a.action === action ? null : a)), 4000);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm">التاريخ</th>
              <th className="px-6 py-4 font-semibold text-sm">العميل</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">المبلغ</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">مدفوع / متبقي</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">رقم الفاتورة</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">حالة التسليم</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">جاري التحميل...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">لا توجد أوامر بيع حالياً</td></tr>
            ) : (
              orders.map((order) => {
                const cancelled = order.status === 'CANCELLED';
                const delivered = !!order.delivered_at;
                const paid = Number(order.paid_amount ?? 0);
                const remaining = Number(order.remaining ?? order.total_amount);
                return (
                <tr key={order.id} className={`hover:bg-white/5 transition-colors group ${cancelled ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{order.customer?.name || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-blue-400">
                      {Number(order.total_amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-100 mr-1">ج.م</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-emerald-300">{paid.toLocaleString()}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className={`text-sm font-bold ${remaining > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
                      {remaining.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-bold">{order.invoice_number || `#${order.id}`}</span>
                    {order.notes?.match(/^\[PQ-/) && (
                      <span className="mr-2 inline-block px-2 py-0.5 rounded-full bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs font-semibold align-middle">
                        Peachtree
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DeliveryBadge order={order} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 flex-wrap max-w-72">
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
                      {!cancelled && !delivered && (
                        <button
                          onClick={() => onEdit(order)}
                          className="p-2 bg-cyan-600/20 text-cyan-300 rounded-lg hover:bg-cyan-600/40 transition"
                          title="تعديل الطلب"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}
                      {!cancelled && remaining > 0 && (
                        <button
                          onClick={() => onOpenPayment(order)}
                          className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40 transition"
                          title="تسجيل دفعة"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                      )}
                      {!cancelled && (
                        <button
                          onClick={() => onReturn(order)}
                          className="p-2 bg-orange-600/20 text-orange-300 rounded-lg hover:bg-orange-600/40 transition"
                          title="مرتجع من الطلب"
                        >
                          <Undo2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onPrint(order)}
                        className="p-2 bg-slate-600/20 text-slate-400 rounded-lg hover:bg-slate-600/40 transition"
                        title="طباعة فاتورة A4"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onReceipt(order)}
                        className="p-2 bg-slate-600/20 text-slate-300 rounded-lg hover:bg-slate-600/40 transition"
                        title="طباعة إيصال حراري"
                      >
                        <Receipt className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onShare(order)}
                        className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 transition"
                        title="مشاركة واتساب"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      {!cancelled && !delivered && (
                        <button
                          onClick={() => onDeliver(order)}
                          className="p-2 bg-teal-600/20 text-teal-300 rounded-lg hover:bg-teal-600/40 transition"
                          title="تسليم الطلب"
                        >
                          <Truck className="w-5 h-5" />
                        </button>
                      )}
                      {!cancelled && !delivered && (
                        <button
                          onClick={() => armOrFire(order, 'cancel')}
                          className={`p-2 rounded-lg transition ${armed?.id === order.id && armed.action === 'cancel' ? 'bg-amber-600 text-white animate-pulse' : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/40'}`}
                          title={armed?.id === order.id && armed.action === 'cancel' ? 'اضغط مجدداً للتأكيد' : 'إلغاء الطلب وإرجاع المخزون'}
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      )}
                      {!delivered && (
                        <button
                          onClick={() => armOrFire(order, 'delete')}
                          className={`p-2 rounded-lg transition ${armed?.id === order.id && armed.action === 'delete' ? 'bg-red-600 text-white animate-pulse' : 'bg-red-600/20 text-red-400 hover:bg-red-600/40'}`}
                          title={armed?.id === order.id && armed.action === 'delete' ? 'اضغط مجدداً للتأكيد' : 'حذف الطلب نهائياً'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
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
