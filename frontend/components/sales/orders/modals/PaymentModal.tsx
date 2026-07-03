'use client';

import { X } from 'lucide-react';
import type { Order, PaymentData } from '../types';

export function PaymentModal({
  show, order, paymentData, setPaymentData, onSubmit, onClose,
}: {
  show: boolean;
  order: Order | null;
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!show || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">تسجيل دفعة نقدية</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><label className="block text-sm text-gray-400 mb-1">العميل</label><div className="text-white font-bold p-3 bg-white/5 rounded-xl border border-white/10">{order.customer?.name}</div></div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">قيمة الدفعة</label>
            <input type="number" required value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:border-emerald-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">تاريخ التحصيل</label>
            <input type="date" required value={paymentData.payment_date} onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none transition" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
            <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none resize-none transition" rows={2} />
          </div>
          <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/40">تأكيد التحصيل</button></div>
        </form>
      </div>
    </div>
  );
}
