'use client';

import type { Order } from '@/components/purchases/types';

interface PaymentModalProps {
  show: boolean;
  order: Order | null;
  paymentData: { amount: number; payment_date: string; notes: string };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onPaymentDataChange: (data: PaymentModalProps['paymentData']) => void;
}

export default function PaymentModal({
  show, order, paymentData, onClose, onSubmit, onPaymentDataChange,
}: PaymentModalProps) {
  if (!show || !order) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">تسجيل دفعة للمورد</h2>
        <div className="mb-4 text-gray-300 text-sm">
          <p>المورد: <span className="text-white font-semibold">{order.supplier?.name}</span></p>
          <p>
            إجمالي الأمر: <span className="text-green-400 font-semibold">
              {Number(order.total_amount).toLocaleString()} جنيه
            </span>
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">المبلغ</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => onPaymentDataChange({ ...paymentData, amount: Number(e.target.value) })}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
            <input
              type="date"
              value={paymentData.payment_date}
              onChange={(e) => onPaymentDataChange({ ...paymentData, payment_date: e.target.value })}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => onPaymentDataChange({ ...paymentData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700"
            >
              تسجيل الدفعة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
