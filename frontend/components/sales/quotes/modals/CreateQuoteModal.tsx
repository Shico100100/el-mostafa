'use client';

import { Plus, Trash2, X } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Customer, Product } from '@/components/sales/quotes/types';
import type { NewQuoteItem } from '@/hooks/sales/useQuotes';

interface CreateQuoteModalProps {
  visible: boolean;
  customers: Customer[];
  products: Product[];
  newQuote: { customer_id: string; notes: string; items: NewQuoteItem[] };
  onClose: () => void;
  onNewQuoteChange: (data: { customer_id: string; notes: string; items: NewQuoteItem[] }) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: string, value: string | number) => void;
  calculateTotal: () => number;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateQuoteModal({
  visible, customers, products, newQuote, onClose, onNewQuoteChange,
  onAddItem, onRemoveItem, onItemChange, calculateTotal, onSubmit,
}: CreateQuoteModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">إنشاء عرض سعر جديد</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">العميل</label>
              <SearchableSelect
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                value={newQuote.customer_id}
                onChange={(val) => onNewQuoteChange({ ...newQuote, customer_id: val.toString() })}
                placeholder="اختر العميل..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">ملاحظات</label>
              <input type="text" value={newQuote.notes}
                onChange={(e) => onNewQuoteChange({ ...newQuote, notes: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none transition"
                placeholder="ملاحظات..." />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">الأصناف</h3>
              <button type="button" onClick={onAddItem}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-500/30 transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> إضافة صنف
              </button>
            </div>
            {newQuote.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="text-xs text-gray-400 mr-2">المنتج</label>
                  <SearchableSelect
                    options={products.map((p) => ({ value: p.id, label: p.name }))}
                    value={item.product_id}
                    onChange={(val) => onItemChange(index, 'product_id', val)}
                    placeholder="اختر المنتج..."
                    className="w-full"
                  />
                </div>
                <div className="w-24 space-y-2">
                  <label className="text-xs text-gray-400 mr-2">الكمية</label>
                  <input type="number" value={item.quantity}
                    onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value))}
                    required min="1"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500 outline-none transition" />
                </div>
                <div className="w-28 space-y-2">
                  <label className="text-xs text-gray-400 mr-2">سعر الوحدة</label>
                  <input type="number" value={item.price}
                    onChange={(e) => onItemChange(index, 'price', parseFloat(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500 outline-none transition" />
                </div>
                <div className="w-28 pb-2 text-left text-blue-300 font-bold text-sm">
                  {Number(item.total).toLocaleString()}
                </div>
                <button type="button" onClick={() => onRemoveItem(index)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition mb-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {newQuote.items.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                لم يتم إضافة أي أصناف بعد
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-6 border-t border-white/10">
            <div className="text-white">
              <span className="text-gray-400 ml-2">الإجمالي:</span>
              <span className="text-3xl font-bold text-blue-400">{calculateTotal().toLocaleString()}</span>
              <span className="text-sm text-gray-500 mr-1">ج.م</span>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onClose}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold">
                إلغاء
              </button>
              <button type="submit" disabled={newQuote.items.length === 0 || !newQuote.customer_id}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 transition disabled:opacity-50">
                حفظ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
