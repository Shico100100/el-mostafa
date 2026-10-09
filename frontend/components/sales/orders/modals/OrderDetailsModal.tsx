'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AttachmentSection from '@/components/ui/AttachmentSection';
import { api } from '@/lib/api';
import type { Order, OrderItem, OrderPayment } from '../types';

const METHOD_LABELS: Record<string, string> = { cash: 'نقدي', check: 'شيك', transfer: 'تحويل بنكي' };

export function OrderDetailsModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const orderId = order?.id;

  useEffect(() => {
    if (!orderId) return;
    api.fetchWithAuth(`/sales/orders/${orderId}/items`)
      .then((data: OrderItem[] | { value?: OrderItem[] }) => setItems(Array.isArray(data) ? data : data.value ?? []))
      .catch(() => setItems([]));
    api.fetchWithAuth(`/sales/orders/${orderId}/payments`)
      .then((data: OrderPayment[]) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]));
  }, [orderId]);
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl space-y-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">تفاصيل أمر البيع {order.invoice_number || `#${order.id}`}</h2>
            <p className="text-gray-400">بتاريخ {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl"><X className="w-6 h-6" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">بيانات العميل</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <p className="text-white"><span className="text-emerald-100 ml-2">الاسم:</span> {order.customer?.name}</p>
              <p className="text-white"><span className="text-emerald-100 ml-2">الهاتف:</span> {order.customer?.phone || 'غير مسجل'}</p>
              <p className="text-white"><span className="text-emerald-100 ml-2">العنوان:</span> {order.customer?.address || 'غير مسجل'}</p>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold text-white">القيم المالية</h3>
            <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20 space-y-2">
              <p className="text-gray-400 text-sm">الإجمالي</p>
              <p className="text-3xl font-black text-blue-400">{Number(order.total_amount).toLocaleString()} <span className="text-sm">ج.م</span></p>
              {order.discount_type && order.discount_type !== 'none' && (
                <p className="text-xs text-gray-400">
                  يشمل خصم {order.discount_type === 'percentage' ? `نسبة ${order.discount_value}%` : `مبلغ ${Number(order.discount_value).toLocaleString()} ج.م`}
                </p>
              )}
              <div className="flex gap-4 pt-1 text-sm">
                <span className="text-gray-400">مدفوع: <span className="text-emerald-300 font-bold">{Number(order.paid_amount ?? 0).toLocaleString()}</span></span>
                <span className="text-gray-400">متبقي: <span className="text-amber-300 font-bold">{Number(order.remaining ?? order.total_amount).toLocaleString()}</span></span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-gray-400 text-sm">حالة التسليم</p>
              {order.delivered_at ? (
                <p className="text-emerald-300 font-bold mt-1">
                  مسلّم بتاريخ {new Date(order.delivered_at).toLocaleDateString('ar-EG')}
                  <span className="block text-xs text-emerald-400/70 mt-0.5">تم خصم الكميات من المخزون عند إنشاء الطلب</span>
                </p>
              ) : (
                <p className="text-slate-300 font-bold mt-1">لم يُسلَّم بعد — الكميات مخصومة من المخزون منذ إنشاء الطلب</p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">الأصناف</h3>
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-white/5 text-gray-400 text-xs">
                <tr><th className="px-4 py-3">الصنف</th><th className="px-4 py-3 text-center">الكمية</th><th className="px-4 py-3 text-center">السعر</th><th className="px-4 py-3 text-center">الإجمالي</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item: OrderItem) => (
                  <tr key={item.id} className="text-sm">
                    <td className="px-4 py-3 text-white font-medium">{item.product?.name}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{item.quantity} {item.product?.unit}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{Number(item.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-blue-300 font-bold">{Number(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {payments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">الدفعات المسجلة على الطلب</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-gray-400 text-xs">
                  <tr><th className="px-4 py-3">التاريخ</th><th className="px-4 py-3 text-center">المبلغ</th><th className="px-4 py-3 text-center">الطريقة</th><th className="px-4 py-3">ملاحظات</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="text-sm">
                      <td className="px-4 py-3 text-gray-300">{new Date(pay.payment_date).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-3 text-center text-emerald-300 font-bold">{Number(pay.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{pay.method ? (METHOD_LABELS[pay.method] || pay.method) : '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{pay.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {order.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400">ملاحظات</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-gray-300 text-sm italic">{order.notes}</div>
          </div>
        )}
        <div className="border-t border-white/10 pt-6">
          <AttachmentSection relatedType="SalesOrder" relatedId={order.id} />
        </div>
        {(order.created_by_name || order.updated_by_name || order.delivered_by_name || order.cancelled_by_name) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400">سجل الإجراءات</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-gray-300 text-sm space-y-1">
              {order.created_by_name && <p>أنشأها: {order.created_by_name}</p>}
              {order.updated_by_name && <p>عدّلها: {order.updated_by_name}</p>}
              {order.delivered_by_name && <p>سلّمها: {order.delivered_by_name}</p>}
              {order.cancelled_by_name && <p>ألغاها: {order.cancelled_by_name}</p>}
            </div>
          </div>
        )}
        <div className="flex justify-end pt-4">
          <button onClick={onClose} className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
