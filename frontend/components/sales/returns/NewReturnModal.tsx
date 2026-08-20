'use client';

import { RotateCcw, FileText, Save, X } from 'lucide-react';
import type { NewReturnForm, Customer, Order } from '@/components/sales/returns/types';

interface Props {
  show: boolean;
  newReturn: NewReturnForm;
  customers: Customer[];
  orders: Order[];
  onClose: () => void;
  onCustomerChange: (id: string) => void;
  onOrderChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onItemQtyChange: (index: number, qty: number) => void;
  total: string;
  onSubmit: () => void;
}

export function NewReturnModal({
  show, newReturn, customers, orders, onClose,
  onCustomerChange, onOrderChange, onDateChange, onReasonChange,
  onItemQtyChange, total, onSubmit,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-black text-rose-400 flex items-center gap-2">
            <RotateCcw className="w-6 h-6" />
            تسجيل مرتجع جديد
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-[#ecfdf5]0 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#ecfdf5]0 mr-1 italic">العميل</label>
              <select
                value={newReturn.customer_id}
                onChange={(e) => onCustomerChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition appearance-none"
              >
                <option value="" className="bg-slate-900">اختر العميل...</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#ecfdf5]0 mr-1 italic">الفاتورة الأصلية (اختياري)</label>
              <select
                disabled={!newReturn.customer_id}
                value={newReturn.order_id}
                onChange={(e) => onOrderChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition disabled:opacity-30 appearance-none"
              >
                <option value="" className="bg-slate-900">اختر الفاتورة...</option>
                {orders.map(o => <option key={o.id} value={o.id} className="bg-slate-900">فاتورة #{o.id} - {new Date(o.order_date).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#ecfdf5]0 mr-1 italic">تاريخ المرتجع</label>
              <input
                type="date"
                value={newReturn.return_date}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500 text-white transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ecfdf5]0 mr-1 italic">سبب الإرجاع</label>
            <textarea
              value={newReturn.reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition h-20 resize-none"
              placeholder="اكتب سبب الإرجاع هنا..."
            />
          </div>

          {newReturn.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <FileText className="w-4 h-4" />
                الأصناف المرتجعة
              </h3>
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-white/5 text-[#ecfdf5]0">
                      <th className="px-4 py-3">الصنف</th>
                      <th className="px-4 py-3 text-center">الكمية المباعة</th>
                      <th className="px-4 py-3 text-center w-32">الكمية المرتجعة</th>
                      <th className="px-4 py-3 text-center">السعر</th>
                      <th className="px-4 py-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {newReturn.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-bold">{item.name}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{item.original_qty}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={item.original_qty}
                            value={item.quantity}
                            onChange={(e) => onItemQtyChange(idx, +e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-center text-white focus:outline-none focus:border-rose-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">{item.unit_price} ج.م</td>
                        <td className="px-4 py-3 text-left font-bold text-rose-400">{item.total.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-rose-600/10">
                      <td colSpan={4} className="px-4 py-4 text-left font-black text-rose-400">إجمالي المرتجع:</td>
                      <td className="px-4 py-4 text-left font-black text-white text-lg">
                        {total} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition">
            إلغاء
          </button>
          <button onClick={onSubmit} className="px-8 py-3 rounded-2xl font-black bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-2 shadow-lg shadow-rose-900/40">
            <Save className="w-5 h-5" />
            حفظ المرتجع
          </button>
        </div>
      </div>
    </div>
  );
}
