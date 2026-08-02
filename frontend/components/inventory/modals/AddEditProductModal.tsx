'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, Warehouse, Product } from '../types';
import { api } from '@/lib/api';

interface AddEditProductModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: Category[];
  warehouses: Warehouse[];
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function AddEditProductModal({ isOpen, editingProduct, categories, warehouses, onClose, onSubmit }: AddEditProductModalProps) {
  const [imagePath, setImagePath] = useState(editingProduct?.image_path || '');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.fetchWithAuth<{ url: string }>('/inventory/products/upload-image', {
        method: 'POST',
        body: formData,
      });
      setImagePath(res.url);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            {editingProduct?.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم المنتج <span className="text-red-400">*</span></label>
                <input name="name" type="text" defaultValue={editingProduct?.name} required
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: شاسيه بلاستيك مقاس 10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">المخزن</label>
                <select name="warehouse_id" defaultValue={editingProduct?.warehouse_id} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-gray-300 focus:border-blue-500 focus:outline-none">
                  <option value="">اختر المخزن...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نوع المنتج</label>
                <select name="type" defaultValue={editingProduct?.type || 'FINISHED'} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-gray-300 focus:border-blue-500 focus:outline-none">
                  <option value="FINISHED">منتج تام</option>
                  <option value="IMPORTED">مستورد</option>
                  <option value="RAW_PLASTIC">خام بلاستيك</option>
                  <option value="PACKAGING">تغليف</option>
                  <option value="CARTON">كرتونة</option>
                  <option value="BOX">علبة</option>
                  <option value="RAW">خامة</option>
                  <option value="SEMI">نصف مصنع</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">وحدة القياس</label>
                <input name="unit" defaultValue={editingProduct?.unit || 'piece'} list="units" className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
                <datalist id="units">
                  <option value="piece">قطعة</option>
                  <option value="kg">كيلوجرام</option>
                  <option value="meter">متر</option>
                  <option value="box">علبة</option>
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">سعر البيع</label>
                  <input name="selling_price" type="number" step="0.01" min="0" defaultValue={editingProduct?.selling_price ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">سعر التكلفة</label>
                  <input name="cost_price" type="number" step="0.01" min="0" defaultValue={editingProduct?.cost_price ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                  <input name="sku" defaultValue={editingProduct?.sku ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="رمز المنتج" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Barcode</label>
                  <input name="barcode" defaultValue={editingProduct?.barcode ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="باركود" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">التصنيف</label>
                  <select name="category_id" defaultValue={editingProduct?.category_id ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-gray-300 focus:border-blue-500 focus:outline-none">
                    <option value="">اختر التصنيف...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">حد الطلب الأدنى</label>
                  <input name="min_stock" type="number" step="1" min="0" defaultValue={editingProduct?.min_stock ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">وزن القطعة (جرام)</label>
                <input name="weight_grams" type="number" step="0.01" min="0" defaultValue={editingProduct?.weight_grams ?? ''} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="مثال: 50" />
                <p className="text-xs text-gray-500 mt-1">يساعد في حساب عدد القطع عند الشراء بالكيلو</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">وصف المنتج</label>
                <textarea name="description" defaultValue={editingProduct?.description ?? ''} rows={2} className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="ملاحظات إضافية..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">صورة المنتج</label>
                <div className="flex items-center gap-4">
                  {imagePath ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePath} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePath('')}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 text-white rounded-full text-xs flex items-center justify-center"
                      >✕</button>
                    </div>
                  ) : editingProduct?.image_path ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editingProduct.image_path} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border border-dashed border-white/20 bg-slate-900/30 flex items-center justify-center text-gray-500 text-xs">
                      لا توجد
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition text-sm">
                    {uploading ? 'جاري الرفع...' : 'اختيار صورة'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <input type="hidden" name="image_path" value={imagePath} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition font-medium">
              إلغاء
            </button>
            <button type="submit" className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg shadow-blue-900/20">
              {editingProduct?.id ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
