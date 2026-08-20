'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AttachmentSection from '@/components/ui/AttachmentSection';
import { api } from '@/lib/api';
import type { Order, OrderItem } from '../types';

export function OrderDetailsModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const orderId = order?.id;

  useEffect(() => {
    if (!orderId) return;
    api.fetchWithAuth(`/sales/orders/${orderId}/items`)
      .then((data: OrderItem[] | { value?: OrderItem[] }) => setItems(Array.isArray(data) ? data : data.value ?? []))
      .catch(() => setItems([]));
  }, [orderId]);
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl space-y-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">تفاصيل أمر البيع #{order.id}</h2>
            <p className="text-gray-400">بتاريخ {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl"><X className="w-6 h-6" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">بيانات العميل</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <p className="text-white"><span className="text-[#ecfdf5]0 ml-2">الاسم:</span> {order.customer?.name}</p>
              <p className="text-white"><span className="text-[#ecfdf5]0 ml-2">الهاتف:</span> {order.customer?.phone || 'غير مسجل'}</p>
              <p className="text-white"><span className="text-[#ecfdf5]0 ml-2">العنوان:</span> {order.customer?.address || 'غير مسجل'}</p>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold text-white">القيم المالية</h3>
            <div className="bg-blue-600/10 p-4 rounded-xl border border-emerald-500/20">
              <p className="text-gray-400 text-sm">الإجمالي</p>
              <p className="text-3xl font-black text-blue-400">{Number(order.total_amount).toLocaleString()} <span className="text-sm">ج.م</span></p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-gray-400 text-sm">حالة التسليم</p>
              {order.delivered_at ? (
                <p className="text-emerald-300 font-bold mt-1">
                  مسلّم بتاريخ {new Date(order.delivered_at).toLocaleDateString('ar-EG')}
                  <span className="block text-xs text-emerald-400/70 mt-0.5">تم خصم الكميات من المخزون تلقائياً</span>
                </p>
              ) : (
                <p className="text-slate-300 font-bold mt-1">لم يُسلَّم بعد</p>
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
        {order.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400">ملاحظات</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-gray-300 text-sm italic">{order.notes}</div>
          </div>
        )}
        <div className="border-t border-white/10 pt-6">
          <AttachmentSection relatedType="SalesOrder" relatedId={order.id} />
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={onClose} className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
