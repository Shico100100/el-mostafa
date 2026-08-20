'use client';

import { Download, Upload, X } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Supplier, Product, NewOrderItem } from '@/components/purchases/types';

interface PurchaseOrderModalProps {
  show: boolean;
  editingOrder: boolean;
  newOrder: {
    supplier_id: string;
    date: string;
    invoice_number: string;
    notes: string;
    items: NewOrderItem[];
  };
  suppliers: Supplier[];
  products: Product[];
  typingValues: { [key: string]: string };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewOrderChange: (order: PurchaseOrderModalProps['newOrder']) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: string, value: string | number) => void;
  onItemTotalChange: (index: number, totalValue: string) => void;
  onTypedChange: (index: number, field: string, value: string) => void;
  onExportItems: () => void;
  onImportItems: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuickProduct: (index: number) => void;
  calculateTotal: () => number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function PurchaseOrderModal({
  show, editingOrder, newOrder, suppliers, products, typingValues,
  onClose, onSubmit, onNewOrderChange, onAddItem, onRemoveItem,
  onItemChange, onItemTotalChange, onTypedChange,
  onExportItems, onImportItems, onQuickProduct, calculateTotal, fileInputRef,
}: PurchaseOrderModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto pt-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {editingOrder ? 'تعديل أمر الشراء' : 'أمر شراء جديد'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">المورد</label>
              <select
                value={newOrder.supplier_id}
                onChange={(e) => onNewOrderChange({ ...newOrder, supplier_id: e.target.value })}
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="">اختر المورد</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
              <input
                type="date"
                value={newOrder.date}
                onChange={(e) => onNewOrderChange({ ...newOrder, date: e.target.value })}
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">رقم فاتورة المورد</label>
              <input
                type="text"
                value={newOrder.invoice_number}
                onChange={(e) => onNewOrderChange({ ...newOrder, invoice_number: e.target.value })}
                placeholder="(اختياري)"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">الأصناف</h3>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onImportItems}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded text-sm"
                >
                  <Download className="w-4 h-4 inline" /> استيراد Excel
                </button>
                <button
                  type="button"
                  onClick={onExportItems}
                  disabled={newOrder.items.length === 0}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded text-sm disabled:opacity-40"
                >
                  <Upload className="w-4 h-4 inline" /> تصدير Excel
                </button>
                <button
                  type="button"
                  onClick={onAddItem}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-blue-200 rounded text-sm"
                >
                  + إضافة صنف
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {newOrder.items.map((item, index) => {
                const selectedProduct = products.find(p => p.id === Number(item.product_id));
                const hasWeight = selectedProduct?.weight_grams && Number(selectedProduct.weight_grams) > 0;
                return (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">المنتج (خامة)</label>
                      <SearchableSelect
                        options={products.map(p => ({ value: p.id, label: p.name }))}
                        value={item.product_id ? Number(item.product_id) : ''}
                        onChange={(val) => onItemChange(index, 'product_id', String(val))}
                        placeholder="اختر الخامة"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickProduct(index)}
                      className="mb-1 p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-blue-200 rounded text-sm h-[38px] flex items-center justify-center"
                      title="إضافة صنف جديد"
                    >
                      +
                    </button>
                    {hasWeight && (
                      <div className="w-20">
                        <label className="block text-xs text-gray-400 mb-1">كجم</label>
                        <input
                          type="number"
                          value={typingValues[`${index}-kg`] ?? item.weight_kg ?? ''}
                          onChange={(e) => {
                            const kg = e.target.value;
                            const newTyping = { ...typingValues, [`${index}-kg`]: kg };
                            delete newTyping[`${index}-quantity`];
                            onTypedChange(index, 'weight_kg', kg);
                            const w = Number(selectedProduct?.weight_grams || 0);
                            if (kg && w > 0) {
                              const pcs = Math.round((Number(kg) * 1000) / w);
                              onItemChange(index, 'quantity', pcs);
                            }
                          }}
                          min="0"
                          step="0.001"
                          className="w-full px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded text-white text-sm"
                          placeholder="وزن"
                        />
                      </div>
                    )}
                    <div className="w-32">
                      <label className="block text-xs text-gray-400 mb-1">الكمية</label>
                      <input
                        type="number"
                        value={typingValues[`${index}-quantity`] ?? item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          onTypedChange(index, 'quantity', val);
                          if (hasWeight && val) {
                            const w = Number(selectedProduct?.weight_grams || 0);
                            if (w > 0) {
                              const calculatedKg = Math.round(Number(val) * w / 10) / 100;
                              const kgStr = String(calculatedKg);
                              onItemChange(index, 'weight_kg', kgStr);
                            }
                          }
                        }}
                        onBlur={() => {
                          const newTyping = { ...typingValues };
                          delete newTyping[`${index}-quantity`];
                        }}
                        required
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-400 mb-1">سعر الوحدة</label>
                      <input
                        type="number"
                        value={typingValues[`${index}-price`] ?? item.price}
                        onChange={(e) => onTypedChange(index, 'price', e.target.value)}
                        onBlur={() => {
                          const newTyping = { ...typingValues };
                          delete newTyping[`${index}-price`];
                        }}
                        required
                        min="0"
                        step="any"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-gray-400 mb-1">الإجمالي</label>
                      <input
                        type="number"
                        value={typingValues[`${index}-total`] ?? (item.quantity && item.price ? (Number(item.quantity) * Number(item.price)) : '')}
                        onChange={() => {}}
                        onBlur={(e) => onItemTotalChange(index, e.target.value)}
                        required
                        min="0"
                        step="any"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="pb-2 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {newOrder.items.length === 0 && (
                <div className="text-center text-[#ecfdf5]0 py-4">
                  أضف أصناف للأمر
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-4">
            <div className="text-xl font-bold text-white">
              الإجمالي: <span className="text-green-400">{calculateTotal().toLocaleString()} جنيه</span>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={newOrder.items.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ الأمر
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
