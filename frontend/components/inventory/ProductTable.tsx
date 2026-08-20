'use client';

import { Warehouse, Gauge } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TypeBadge from './TypeBadge';
import SortHeader from './SortHeader';
import type { Product, SortField, SortDir } from './types';

interface ProductTableProps {
  products: Product[];
  sortField: SortField;
  sortDir: SortDir;
  onToggleSort: (field: SortField) => void;
  inlineEditingId: number | null;
  editForm: { selling_price: string; stock_quantity: string };
  onEditFormChange: (field: 'selling_price' | 'stock_quantity', value: string) => void;
  onStartInlineEdit: (product: Product) => void;
  onSaveInlineEdit: (id: number) => void;
  onOpenAdjustment: (product: Product) => void;
  onEditFull: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: number) => void;
  loading: boolean;
  margin: (p: Product) => { value: number; pct: number };
}

export default function ProductTable({
  products,
  sortField,
  sortDir,
  onToggleSort,
  inlineEditingId,
  editForm,
  onEditFormChange,
  onStartInlineEdit,
  onSaveInlineEdit,
  onOpenAdjustment,
  onEditFull,
  onDuplicate,
  onDelete,
  loading,
  margin,
}: ProductTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-4 text-right text-gray-300 font-semibold text-sm w-14">صورة</th>
              <SortHeader field="name" label="الاسم / الكود" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="type" label="النوع" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">المخزن</th>
              <SortHeader field="cost_price" label="التكلفة" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="selling_price" label="سعر البيع" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="margin" label="الهامش" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <SortHeader field="stock_quantity" label="المخزون" sortField={sortField} sortDir={sortDir} onToggle={onToggleSort} />
              <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">قيمة المخزون</th>
              <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => {
              const m = margin(product);
              return (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/inventory/products/${product.id}/movements`)}
                  className="hover:bg-white/5 cursor-pointer transition group"
                >
                  <td className="px-4 py-4">
                    {product.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_path}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg border border-white/10 cursor-pointer hover:scale-150 transition"
                        onClick={(e) => { e.stopPropagation(); window.open(product.image_path, '_blank'); }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xs text-[#ecfdf5]0">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{product.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={product.type} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-[#ecfdf5]0" />
                      {product.warehouse?.name || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {Number(product.cost_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm font-medium">
                    {inlineEditingId === product.id ? (
                      <input
                        type="number"
                        value={editForm.selling_price}
                        onChange={(e) => onEditFormChange('selling_price', e.target.value)}
                        className="w-24 bg-slate-900 border border-emerald-500 rounded px-2 py-1 outline-none text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      Number(product.selling_price).toLocaleString()
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-semibold ${m.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.value.toLocaleString()}
                      <span className="text-xs mr-1 font-normal opacity-70">
                        ({m.pct >= 0 ? '+' : ''}{m.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === product.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={editForm.stock_quantity}
                          onChange={(e) => onEditFormChange('stock_quantity', e.target.value)}
                          className="w-20 bg-slate-900 border border-emerald-500 rounded px-2 py-1 outline-none text-white"
                        />
                        <span className="text-xs text-[#ecfdf5]0">{product.unit}</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 font-semibold ${product.stock_quantity <= (product.min_stock || 0) ? 'text-red-400' : 'text-green-400'}`}>
                        {product.stock_quantity}
                        <span className="text-xs font-normal text-[#ecfdf5]0">{product.unit || 'قطعة'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {(Number(product.cost_price) * product.stock_quantity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      {inlineEditingId === product.id ? (
                        <button
                          onClick={() => onSaveInlineEdit(product.id)}
                          className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-200 rounded-lg transition"
                          title="حفظ"
                        >
                          ✔️
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onStartInlineEdit(product)}
                            className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="تعديل سريع"
                          >
                            ⚡
                          </button>
                          <button
                            onClick={() => onOpenAdjustment(product)}
                            className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="تسوية مخزون"
                          >
                            <Gauge className="w-4 h-4" />
                          </button>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditFull(product)}
                              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-blue-200 rounded-lg transition"
                              title="تعديل كامل"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => onDuplicate(product)}
                              className="p-1.5 bg-teal-500/20 hover:bg-teal-500/40 text-purple-200 rounded-lg transition"
                              title="نسخ المنتج"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => onDelete(product.id)}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition"
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl mb-2">🔍</span>
                    <p>لا توجد منتجات تطابق البحث</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
