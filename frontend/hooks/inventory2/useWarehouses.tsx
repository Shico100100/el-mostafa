/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface WH {
  id: number; name: string; description?: string; is_active: boolean; created_at: string;
}

export interface WarehouseForm {
  name: string;
  description: string;
}

export function useWarehouses() {
  const router = useRouter();
  const [items, setItems] = useState<WH[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WH | null>(null);
  const [form, setForm] = useState<WarehouseForm>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth<WH[]>('/inventory/warehouses');
      setItems(data || []);
      const counts: Record<number, number> = {};
      for (const w of data as WH[]) {
        try {
          const stock = await api.fetchWithAuth(`/inventory/warehouses/${w.id}/stock`);
          counts[w.id] = (stock as any[]).length;
        } catch { counts[w.id] = 0; }
      }
      setStockCounts(counts);
    } catch { toast.error('فشل تحميل المخازن'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInit = async () => {
    try {
      const result = await api.fetchWithAuth<{ message: string }>('/inventory/warehouses/init', { method: 'POST' });
      toast.success(result.message || 'تم تهيئة المخازن');
      load();
    } catch { toast.error('فشل تهيئة المخازن'); }
  };

  const filtered = items.filter((w) =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (w: WH) => { setEditing(w); setForm({ name: w.name, description: w.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم المخزن مطلوب'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.fetchWithAuth(`/inventory/warehouses/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('تم التحديث');
      } else {
        await api.fetchWithAuth('/inventory/warehouses', { method: 'POST', body: JSON.stringify(form) });
        toast.success('تمت الإضافة');
      }
      setShowModal(false);
      load();
    } catch (e: any) { toast.error(e.message || 'فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: number, name: string) => {
    toast.custom((t: any) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">حذف المخزن: {name}؟</p>
        <p className="text-slate-400 text-sm mb-4">سيتم نقل جميع الأصناف الموجودة فيه</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try { await api.fetchWithAuth(`/inventory/warehouses/${id}`, { method: 'DELETE' }); toast.success('تم حذف المخزن'); load(); }
            catch { toast.error('فشل حذف المخزن'); }
          }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return {
    items, stockCounts, loading, search, setSearch, showModal, setShowModal,
    editing, setEditing, form, setForm, saving, filtered, handleInit,
    openNew, openEdit, handleSave, handleDelete, load,
  };
}
