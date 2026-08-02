'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Warehouse, Plus, ArrowLeft, Package, MapPin, Edit2, Trash2, RefreshCw } from 'lucide-react';

interface WarehouseItem {
  id: number;
  name: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [stockCounts, setStockCounts] = useState<Record<number, number>>({});

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth('/inventory/warehouses');
      setWarehouses(data || []);
      // Get stock counts for each warehouse
      const counts: Record<number, number> = {};
      for (const w of data as WarehouseItem[]) {
        try {
          const stock = await api.fetchWithAuth(`/inventory/warehouses/${w.id}/stock`);
          counts[w.id] = (stock as Record<string, unknown>[]).length;
        } catch { counts[w.id] = 0; }
      }
      setStockCounts(counts);
    } catch {
      toast.error('فشل تحميل المخازن');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadWarehouses();
  }, [router, loadWarehouses]);

  const handleInit = async () => {
    try {
      const result = await api.fetchWithAuth('/inventory/warehouses/init', { method: 'POST' });
      toast.success(result.message || 'تم تهيئة المخازن');
      loadWarehouses();
    } catch {
      toast.error('فشل تهيئة المخازن');
    }
  };

  const openCreate = () => {
    setEditingWarehouse(null);
    setForm({ name: '', location: '' });
    setShowModal(true);
  };

  const openEdit = (w: WarehouseItem) => {
    setEditingWarehouse(w);
    setForm({ name: w.name, location: w.location || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('الرجاء إدخال اسم المخزن');
      return;
    }
    try {
      if (editingWarehouse) {
        await api.fetchWithAuth(`/inventory/warehouses/${editingWarehouse.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('تم تحديث المخزن');
      } else {
        await api.fetchWithAuth('/inventory/warehouses', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('تم إضافة المخزن');
      }
      setShowModal(false);
      loadWarehouses();
    } catch {
      toast.error('فشل حفظ المخزن');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    toast.custom((t) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">حذف المخزن: {name}؟</p>
        <p className="text-gray-400 text-sm mb-4">سيتم نقل جميع الأصناف الموجودة فيه</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try {
              await api.fetchWithAuth(`/inventory/warehouses/${id}`, { method: 'DELETE' });
              toast.success('تم حذف المخزن');
              loadWarehouses();
            } catch { toast.error('فشل حذف المخزن'); }
          }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const typeIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('اكسسوار') || n.includes('accessory')) return '🔧';
    if (n.includes('بلاستيك') || n.includes('plastic')) return '🧩';
    if (n.includes('تعبئة') || n.includes('تغليف') || n.includes('كرتون') || n.includes('pack')) return '📦';
    if (n.includes('تام') || n.includes('finished') || n.includes('منتج')) return '✅';
    return '🏭';
  };

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/inventory/products')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">إدارة المخازن</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleInit} className="text-xs px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              تهيئة افتراضي
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-400 text-sm">إجمالي المخازن: {warehouses.length}</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40">
            <Plus className="w-5 h-5" />
            إضافة مخزن
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
        ) : warehouses.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-16 text-center">
            <Warehouse className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">لا توجد مخازن بعد</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleInit} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">تهيئة المخازن الافتراضية</button>
              <button onClick={openCreate} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">إضافة مخزن يدوياً</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {warehouses.map((w) => (
              <div
                key={w.id}
                onClick={() => router.push(`/inventory/warehouses/${w.id}`)}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{typeIcon(w.name)}</div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{w.name}</h3>
                      {w.location && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {w.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${w.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {w.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Package className="w-4 h-4" />
                  <span>{stockCounts[w.id] ?? 0} صنف</span>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(w)} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(w.id, w.name)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">{editingWarehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم المخزن <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: اكسسوار"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الموقع / الوصف</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: مستودع الاكسسوارات والملحقات"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold">
                  {editingWarehouse ? 'حفظ التعديلات' : 'إضافة المخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
