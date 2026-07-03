'use client';

import { Package } from 'lucide-react';
import type { Product, WarehouseItem } from '@/components/inventory2/transfer/types';

interface Props {
  products: Product[];
  warehouses: WarehouseItem[];
  productId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: string;
  notes: string;
  saving: boolean;
  maxQty: number;
  selectedProduct: Product | undefined;
  onProductChange: (id: number) => void;
  onFromWarehouseChange: (id: number) => void;
  onToWarehouseChange: (id: number) => void;
  onQuantityChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function TransferForm({
  products, warehouses, productId, fromWarehouseId, toWarehouseId,
  quantity, notes, saving, maxQty, selectedProduct,
  onProductChange, onFromWarehouseChange, onToWarehouseChange,
  onQuantityChange, onNotesChange, onSubmit, onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">المنتج *</label>
        <select value={productId} onChange={(e) => onProductChange(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none">
          <option value={0}>اختر المنتج...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">{selectedProduct.name}</p>
            <p className="text-xs text-slate-400">إجمالي المخزون: {Number(selectedProduct.stock_quantity).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">من مخزن *</label>
          <select value={fromWarehouseId} onChange={(e) => onFromWarehouseChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none">
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {maxQty > 0 && <p className="text-xs text-amber-400 mt-1.5">المتوفر: {maxQty.toLocaleString()}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">إلى مخزن *</label>
          <select value={toWarehouseId} onChange={(e) => onToWarehouseChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none">
            {warehouses.filter((w) => w.id !== fromWarehouseId).map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">الكمية *</label>
        <input type="number" step="1" min="0.01" max={maxQty || undefined}
          value={quantity} onChange={(e) => onQuantityChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none"
          placeholder="أدخل الكمية..." />
        {maxQty > 0 && <p className="text-xs text-slate-500 mt-1.5">الحد الأقصى: {maxQty.toLocaleString()}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">ملاحظات (اختياري)</label>
        <input type="text" value={notes} onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none"
          placeholder="سبب التحويل..." />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">
          إلغاء
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-amber-900/20 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          {saving ? 'جاري التحويل...' : 'تحويل'}
        </button>
      </div>
    </form>
  );
}
