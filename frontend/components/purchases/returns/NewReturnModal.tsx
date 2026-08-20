'use client';

import { RotateCcw, FileText, Save, X } from 'lucide-react';
import type { Supplier, PurchaseOrder, ReturnItem } from '@/components/purchases/returns/types';

interface NewReturnModalProps {
  visible: boolean;
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  newReturn: {
    supplier_id: string;
    order_id: string;
    reason: string;
    return_date: string;
    items: ReturnItem[];
  };
  onClose: () => void;
  onSupplierChange: (id: string) => void;
  onOrderChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onItemQtyChange: (index: number, qty: number) => void;
  onSubmit: () => void;
}

export function NewReturnModal({
  visible, suppliers, orders, newReturn,
  onClose, onSupplierChange, onOrderChange, onDateChange, onReasonChange,
  onItemQtyChange, onSubmit,
}: NewReturnModalProps) {
  if (!visible) return null;

  const total = newReturn.items.reduce((sum, it) => sum + it.total, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(245,158,11,0.1)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-2xl font-black text-amber-500 flex items-center gap-3">
            <RotateCcw className="w-7 h-7" />
            تسجيل مرتجع مشتريات جديد
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition text-[#ecfdf5]0 hover:text-white group">
            <X className="w-6 h-6 group-hover:scale-110 transition" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#ecfdf5]0 uppercase tracking-widest block mr-1">المورد</label>
              <select value={newReturn.supplier_id} onChange={e => onSupplierChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition appearance-none font-bold">
                <option value="" className="bg-slate-900 text-[#ecfdf5]0 italic">اختر المورد...</option>
                {suppliers.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#ecfdf5]0 uppercase tracking-widest block mr-1">رقم الفاتورة الأصلية</label>
              <select disabled={!newReturn.supplier_id} value={newReturn.order_id} onChange={e => onOrderChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition disabled:opacity-20 appearance-none font-bold">
                <option value="" className="bg-slate-900 text-[#ecfdf5]0 italic">بحث في الفواتير...</option>
                {orders.map(o => <option key={o.id} value={o.id} className="bg-slate-900">فاتورة #{o.id} - بتاريخ {new Date(o.order_date).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#ecfdf5]0 uppercase tracking-widest block mr-1">تاريخ الارتجاع</label>
              <input type="date" value={newReturn.return_date} onChange={e => onDateChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-3.5 focus:outline-none focus:border-amber-500 text-white transition font-bold" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#ecfdf5]0 uppercase tracking-widest block mr-1">سبب الإرجاع / ملاحظات</label>
            <textarea value={newReturn.reason} onChange={e => onReasonChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition h-28 resize-none font-medium leading-relaxed"
              placeholder="ما هو سبب إرجاع هذه البضاعة للمورد؟" />
          </div>

          {newReturn.items.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-grow" />
                <h3 className="text-[10px] font-black text-[#ecfdf5]0 uppercase tracking-[0.3em] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  تفاصيل الأصناف
                </h3>
                <div className="h-px bg-white/10 flex-grow" />
              </div>
              <div className="border border-white/10 rounded-[2rem] overflow-hidden bg-white/[0.01] shadow-inner">
                <table className="w-full text-right text-sm border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[#ecfdf5]0 border-b border-white/10">
                      <th className="px-6 py-4 font-black">الصنف</th>
                      <th className="px-6 py-4 text-center font-black">كمية الشراء</th>
                      <th className="px-6 py-4 text-center w-40 font-black">الكمية المرتجعة</th>
                      <th className="px-6 py-4 text-center font-black">سعر الوحدة</th>
                      <th className="px-6 py-4 text-left font-black">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {newReturn.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.04] transition duration-300">
                        <td className="px-6 py-4 font-black text-slate-200">{item.name}</td>
                        <td className="px-6 py-4 text-center text-[#ecfdf5]0">{item.original_qty}</td>
                        <td className="px-6 py-4">
                          <input type="number" min="0" max={item.original_qty} value={item.quantity}
                            onChange={e => onItemQtyChange(idx, +e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-center text-amber-500 font-black focus:outline-none focus:border-amber-500 transition shadow-inner" />
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{item.unit_price} ج.م</td>
                        <td className="px-6 py-4 text-left font-black text-amber-500">{item.total.toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-500/10 transition">
                      <td colSpan={4} className="px-6 py-6 text-left font-black text-amber-500 uppercase tracking-widest">إجمالي قيمة المرتجع</td>
                      <td className="px-6 py-6 text-left font-black text-white text-2xl">
                        {total.toLocaleString()} <span className="text-xs text-amber-500">ج.م</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-slate-900/40 flex justify-end gap-5">
          <button onClick={onClose}
            className="px-8 py-4 rounded-[1.5rem] font-bold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition group flex items-center gap-2">
            إلغاء التغييرات
          </button>
          <button onClick={onSubmit}
            className="px-10 py-4 rounded-[1.5rem] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-3 shadow-[0_10px_40px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 duration-300 group">
            <Save className="w-5 h-5" />
            حفظ المرتجع النهائي
          </button>
        </div>
      </div>
    </div>
  );
}
