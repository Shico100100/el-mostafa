'use client';

import { Package } from 'lucide-react';
import type { Product, WarehouseItem } from '@/components/inventory2/adjust/types';

interface Props {
  products: Product[];
  warehouses: WarehouseItem[];
  productId: number;
  warehouseId: number;
  newQuantity: string;
  notes: string;
  saving: boolean;
  currentQty: number;
  selectedProduct: Product | undefined;
  currentStock: { quantity: string } | null;
  onProductChange: (id: number) => void;
  onWarehouseChange: (id: number) => void;
  onQuantityChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AdjustForm({
  products, warehouses, productId, warehouseId, newQuantity, notes, saving,
  currentQty, selectedProduct, currentStock,
  onProductChange, onWarehouseChange, onQuantityChange, onNotesChange, onSubmit, onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">المنتج *</label>
        <select value={productId} onChange={(e) => onProductChange(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
          <option value={0}>اختر المنتج...</option>
          {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.type})</option>))}
        </select>
      </div>

      {selectedProduct && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">{selectedProduct.name}</p>
            <p className="text-xs text-slate-400">إجمالي المخزون النظامي: {Number(selectedProduct.stock_quantity).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">المخزن *</label>
        <select value={warehouseId} onChange={(e) => onWarehouseChange(Number(e.target.value))}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
          {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
        </select>
        {currentStock && (
          <p className="text-xs text-amber-400 mt-1.5">
            <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4" /></svg>
            الكمية الحالية في هذا المخزن: {currentQty.toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">الكمية الجديدة *</label>
        <input type="number" step="1" min="0" value={newQuantity} onChange={(e) => onQuantityChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
          placeholder="أدخل الكمية الفعلية..." />
        {currentStock && (
          <p className="text-xs text-[#ecfdf5]0 mt-1.5">
            الفرق: {newQuantity ? (Number(newQuantity) - currentQty).toLocaleString() : '0'} (سالب = نقص، موجب = زيادة)
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">سبب التسوية (اختياري)</label>
        <input type="text" value={notes} onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
          placeholder="مثال: توالف، سرقة، خطأ في الجرد..." />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">إلغاء</button>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg shadow-purple-900/20 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          {saving ? 'جاري الحفظ...' : 'تسوية الكمية'}
        </button>
      </div>
    </form>
  );
}
