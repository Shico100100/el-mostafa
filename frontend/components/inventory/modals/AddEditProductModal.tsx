'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload } from 'lucide-react';
import { api } from '@/lib/api';

interface WH { id: number; name: string; }
interface ProductData {
  id?: number; name: string; type: string; unit: string;
  selling_price: number; stock_quantity: number;
  min_stock?: number | null; warehouse_id?: number; description?: string | null;
  weight_grams?: number | null; image_path?: string | null;
}

export default function AddEditProductModal({ isOpen, product, warehouses, onClose, onSave }: {
  isOpen: boolean; product?: ProductData | null; warehouses: WH[];
  onClose: () => void; onSave: (data: ProductData) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductData>({
    name: '', type: 'FINISHED', unit: 'piece',
    selling_price: 0, stock_quantity: 0,
    min_stock: null, warehouse_id: undefined, description: null,
    weight_grams: null, image_path: null,
  });
  const [imagePath, setImagePath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({ ...product });
      setImagePath(product.image_path || '');
    } else {
      setForm({ name: '', type: 'FINISHED', unit: 'piece', selling_price: 0, stock_quantity: 0, min_stock: null, warehouse_id: warehouses[0]?.id || undefined, description: null, weight_grams: null, image_path: null });
      setImagePath('');
    }
  }, [product, warehouses]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.fetchWithAuth<{ url: string }>('/inventory/products/upload-image', { method: 'POST', body: fd });
      setImagePath(res.url);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, image_path: imagePath || null });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">{product?.id ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" placeholder="اسم المنتج" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">النوع</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
                <option value="FINISHED">منتج تام</option>
                <option value="IMPORTED">مستورد</option>
                <option value="PACKAGING">تغليف</option>
                <option value="RAW">خام</option>
                <option value="RAW_PLASTIC">خام بلاستيك</option>
                <option value="SEMI_FINISHED">نصف مصنع</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الوحدة</label>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" list="units" placeholder="قطعة / كجم" />
              <datalist id="units"><option value="piece" /><option value="kg" /><option value="meter" /><option value="box" /></datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">سعر البيع</label>
              <input type="number" step="0.01" min="0" value={form.selling_price || ''} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الكمية الافتتاحية</label>
              <input type="number" min="0" value={form.stock_quantity || 0} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">المخزن</label>
              <select value={form.warehouse_id || ''} onChange={(e) => setForm({ ...form, warehouse_id: Number(e.target.value) || undefined })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none">
                <option value="">اختر...</option>
                {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الحد الأدنى</label>
              <input type="number" min="0" value={form.min_stock ?? ''} onChange={(e) => setForm({ ...form, min_stock: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">وزن القطعة (جرام)</label>
              <input type="number" step="0.01" min="0" value={form.weight_grams ?? ''} onChange={(e) => setForm({ ...form, weight_grams: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الوصف</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الصورة</label>
              <div className="flex items-center gap-4">
                {imagePath ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
                    <Image src={imagePath} alt="" fill className="object-cover" sizes="80px" />
                    <button type="button" onClick={() => setImagePath('')} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 text-white rounded-full text-xs flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-dashed border-white/20 bg-slate-900/30 flex items-center justify-center text-[#ecfdf5]0 text-xs">لا توجد</div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-blue-300 rounded-lg border border-emerald-500/30 transition text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />{uploading ? 'جاري...' : 'رفع صورة'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">إلغاء</button>
            <button type="submit" disabled={saving || !form.name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 shadow-lg shadow-blue-900/20">
              {saving ? 'جاري...' : product?.id ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
