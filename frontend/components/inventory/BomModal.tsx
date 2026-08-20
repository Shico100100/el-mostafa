'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Box, Plus, Trash2, X } from 'lucide-react';
import type { BOM, CompactProduct } from './types';

interface BomModalProps {
  productId: number;
  productName: string;
  bom: BOM | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BomModal({ productId, productName, bom, onClose, onSaved }: BomModalProps) {
  const [allProducts, setAllProducts] = useState<CompactProduct[]>([]);
  const [form, setForm] = useState({
    name: bom?.name || `BOM - ${productName}`,
    pcs_per_carton: bom?.pcs_per_carton || 1,
    pcs_per_box: bom?.pcs_per_box || 1,
    carton_product_id: bom?.carton_product_id || 0,
    box_product_id: bom?.box_product_id || 0,
    items: bom?.items?.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) || [] as { product_id: number; quantity: number }[],
  });
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    api.fetchWithAuth<CompactProduct[]>('/inventory/products')
      .then((data) => setAllProducts(data || []))
      .catch(() => toast.error('فشل تحميل المنتجات'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { product_id: 0, quantity: 1 }] }));
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index: number, field: 'product_id' | 'quantity', value: number) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      return { ...f, items };
    });
  };

  const handleSave = async () => {
    if (form.items.length === 0) {
      toast.error('يجب إضافة مكون واحد على الأقل');
      return;
    }
    const invalidItem = form.items.find((i) => !i.product_id);
    if (invalidItem) {
      toast.error('يرجى اختيار منتج لكل مكون');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        product_id: productId,
        pcs_per_carton: form.pcs_per_carton,
        pcs_per_box: form.pcs_per_box,
        carton_product_id: form.carton_product_id || null,
        box_product_id: form.box_product_id || null,
        items: form.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };

      if (bom) {
        await api.fetchWithAuth(`/manufacturing/boms/${bom.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('تم تحديث المكونات');
      } else {
        await api.fetchWithAuth('/manufacturing/boms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('تم إضافة المكونات');
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل حفظ المكونات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Box className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {bom ? 'تعديل المكونات (BOM)' : 'إضافة مكونات (BOM)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-400">
            للمنتج: <span className="text-white font-bold">{productName}</span>
          </p>

          {loadingProducts ? (
            <p className="text-[#ecfdf5]0 text-center py-8">جاري تحميل المنتجات...</p>
          ) : (
            <>
              {/* Packaging */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">قطع / كرتونة</label>
                  <input
                    type="number"
                    min={1}
                    value={form.pcs_per_carton}
                    onChange={(e) => setForm({ ...form, pcs_per_carton: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">قطع / عبوة</label>
                  <input
                    type="number"
                    min={1}
                    value={form.pcs_per_box}
                    onChange={(e) => setForm({ ...form, pcs_per_box: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Carton product */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">منتج الكرتونة</label>
                <select
                  value={form.carton_product_id}
                  onChange={(e) => setForm({ ...form, carton_product_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={0}>بدون كرتونة</option>
                  {allProducts.filter((p) => p.id !== productId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Box product */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">منتج العبوة</label>
                <select
                  value={form.box_product_id}
                  onChange={(e) => setForm({ ...form, box_product_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={0}>بدون عبوة</option>
                  {allProducts.filter((p) => p.id !== productId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Components */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">المكونات</label>
                  <button
                    onClick={addItem}
                    className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مكون
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                        className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value={0}>اختر المنتج...</option>
                        {allProducts.filter((p) => p.id !== productId).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0.0001}
                        step={0.0001}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none text-center"
                        placeholder="الكمية"
                      />
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2.5 hover:bg-red-500/20 rounded-xl transition text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {form.items.length === 0 && (
                    <p className="text-[#ecfdf5]0 text-center py-4 text-sm">لم تضف أي مكونات بعد</p>
                  )}
                </div>
              </div>

              {/* Save */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button onClick={onClose} className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                >
                  {saving ? 'جاري الحفظ...' : bom ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
