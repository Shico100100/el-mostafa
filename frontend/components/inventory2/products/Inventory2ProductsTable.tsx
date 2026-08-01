/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Package, Box, Gauge, Check, Zap, Pencil, ClipboardList, Trash2, PowerOff, RotateCcw } from 'lucide-react';
import { TypeBadge, StockBadge } from '@/components/inventory2/Badge';
import type { BOM, Product } from '@/components/inventory2/types';

function SortHeader({ field, label, sortField, sortDir, onToggle }: {
  field: string; label: string; sortField: string; sortDir: string; onToggle: (f: string) => void;
}) {
  return (
    <th className="px-6 py-4 text-right text-white font-semibold text-sm cursor-pointer hover:text-blue-300 select-none" onClick={() => onToggle(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && <span className="text-blue-400 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}

interface Props {
  products: Product[];
  loading: boolean;
  sortField: string;
  sortDir: string;
  onToggleSort: (f: any) => void;  
  inlineEditingId: number | null;
  editForm: Record<string, string>;
  onEditFormChange: (f: Record<string, string>) => void;
  onStartInlineEdit: (p: Product) => void;
  onSaveInlineEdit: (id: number) => void;
  onOpenAdjustment: (id: number) => void;
  onEditFull: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (id: number) => void;
  onMarkDormant: (id: number) => void;
  onRestoreProduct: (id: number) => void;
  onRowClick: (id: number) => void;
  boms: BOM[];
  latestPrices: Record<number, { price: number }>;
  margin: (p: Product) => { value: number; pct: number };
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}

export function Inventory2ProductsTable({
  products, loading, sortField, sortDir, onToggleSort,
  inlineEditingId, editForm, onEditFormChange,
  onStartInlineEdit, onSaveInlineEdit, onOpenAdjustment, onEditFull, onDuplicate, onDelete,
  onMarkDormant, onRestoreProduct,
  onRowClick, boms, latestPrices, margin,
  page, totalPages, totalItems, onPageChange,
}: Props) {
  if (loading) {
    return <div className="text-center text-slate-400 py-20">جاري التحميل...</div>;
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-4 text-right text-white font-semibold text-sm w-14">صورة</th>
              <SortHeader field="name" label="المنتج" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="type" label="النوع" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="cost_price" label="التكلفة" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="selling_price" label="سعر البيع" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="margin" label="الهامش" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="stock_quantity" label="المخزون" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <th className="px-6 py-4 text-right text-white font-semibold text-sm">القيمة</th>
              <th className="px-6 py-4 text-center text-white font-semibold text-sm">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const m = margin(product);
              const qty = Number(product.stock_quantity);
              const cost = Number(product.cost_price);
              const sell = Number(product.selling_price);
              const hasBom = boms.some((b) => b.product_id === product.id);
              const priceMode = product.type === 'FINISHED' ? 'selling' : (product.type === 'IMPORTED' || product.type === 'PACKAGING' || product.type === 'RAW_PLASTIC' ? 'none' : 'cost');
              return (
                <tr key={product.id} className="border-t border-white/5 hover:bg-white/5 transition cursor-pointer group" onClick={() => onRowClick(product.id)}>
                  <td className="px-4 py-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center text-xs text-slate-500">—</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{product.name}</span>
                      {product.type === 'FINISHED' && hasBom && <Box className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{product.unit || 'قطعة'}</div>
                  </td>
                  <td className="px-6 py-4"><TypeBadge type={product.type} /></td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{cost.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {inlineEditingId === product.id ? (
                      <input type="number" value={editForm.selling_price}
                        onChange={(e) => onEditFormChange({ ...editForm, selling_price: e.target.value })}
                        className="w-24 bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 text-white outline-none"
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <span className="text-white">{sell.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${m.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.value.toFixed(2)}<span className="text-xs mr-1 opacity-70">({m.pct >= 0 ? '+' : ''}{m.pct.toFixed(1)}%)</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === product.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input type="number" value={editForm.stock_quantity}
                          onChange={(e) => onEditFormChange({ ...editForm, stock_quantity: e.target.value })}
                          className="w-20 bg-slate-900 border border-blue-500 rounded-lg px-2 py-1 text-white outline-none" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${qty > 0 ? 'text-white' : 'text-red-400'}`}>{qty.toLocaleString()}</span>
                        <StockBadge quantity={qty} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {priceMode === 'none'
                      ? (latestPrices[product.id] ? `${(latestPrices[product.id].price * qty).toLocaleString()}` : '...')
                      : `${(cost * qty).toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      {inlineEditingId === product.id ? (
                        <button onClick={() => onSaveInlineEdit(product.id)} className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-200 rounded-lg transition" title="حفظ"><Check className="w-3.5 h-3.5" /></button>
                      ) : (
                        <>
                          <button onClick={() => onStartInlineEdit(product)} className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 rounded-lg transition" title="تعديل سريع"><Zap className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onOpenAdjustment(product.id)} className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 rounded-lg transition" title="تسوية"><Gauge className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onEditFull(product)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 rounded-lg transition" title="تعديل"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDuplicate(product)} className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-200 rounded-lg transition" title="نسخ المنتج"><ClipboardList className="w-3.5 h-3.5" /></button>
                          {product.type === 'DORMANT' ? (
                            <button onClick={() => onRestoreProduct(product.id)} className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 rounded-lg transition" title="استرجاع"><RotateCcw className="w-3.5 h-3.5" /></button>
                          ) : (
                            <button onClick={() => onMarkDormant(product.id)} className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 rounded-lg transition" title="نقل للخامل"><PowerOff className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => onDelete(product.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>لا توجد منتجات</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-slate-400">عرض {totalItems === 0 ? 0 : (page - 1) * 20 + 1}-{Math.min(page * 20, totalItems)} من {totalItems}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm">السابق</button>
            <span className="px-4 py-2 text-white font-medium bg-white/10 rounded-lg">{page} / {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm">التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
