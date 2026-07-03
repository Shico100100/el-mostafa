'use client';

import { X } from 'lucide-react';
import { StatusBadge } from '@/components/sales/quotes/StatusBadge';
import type { Quote } from '@/components/sales/quotes/types';

interface QuoteDetailsModalProps {
  quote: Quote;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string) => void;
  onConvertToOrder: (id: number) => void;
}

export function QuoteDetailsModal({ quote, onClose, onUpdateStatus, onConvertToOrder }: QuoteDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl space-y-8"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">عرض سعر #{quote.id}</h2>
            <p className="text-gray-400">{new Date(quote.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={quote.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {quote.status === 'DRAFT' && (
          <div className="flex gap-2">
            <button onClick={() => onUpdateStatus(quote.id, 'SENT')}
              className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition text-sm">
              تعيين كـ &ldquo;أرسل للعميل&rdquo;
            </button>
            <button onClick={() => onUpdateStatus(quote.id, 'ACCEPTED')}
              className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-600/30 transition text-sm">
              تعيين كـ &ldquo;مقبول&rdquo;
            </button>
            <button onClick={() => onUpdateStatus(quote.id, 'REJECTED')}
              className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-600/30 transition text-sm">
              تعيين كـ &ldquo;مرفوض&rdquo;
            </button>
            <button onClick={async () => { await onConvertToOrder(quote.id); onClose(); }}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 transition text-sm">
              تحويل إلى أمر بيع
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-sm text-gray-400 mb-1">العميل</h3>
            <p className="text-white font-bold text-lg">{quote.customer?.name}</p>
            <p className="text-gray-400 text-sm">{quote.customer?.phone}</p>
          </div>
          <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-500/20 text-left">
            <p className="text-gray-400 text-sm">الإجمالي</p>
            <p className="text-3xl font-black text-blue-400">
              {Number(quote.total_amount).toLocaleString()} <span className="text-sm">ج.م</span>
            </p>
          </div>
        </div>

        {quote.items && quote.items.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">الأصناف</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-gray-400 text-xs">
                  <tr>
                    <th className="px-4 py-3">المنتج</th>
                    <th className="px-4 py-3 text-center">الكمية</th>
                    <th className="px-4 py-3 text-center">سعر الوحدة</th>
                    <th className="px-4 py-3 text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {quote.items.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-4 py-3 text-white font-medium">{item.product?.name}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{Number(item.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-blue-300 font-bold">{Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {quote.notes && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">ملاحظات</h3>
            <p className="text-gray-300 italic">{quote.notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button onClick={onClose}
            className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
