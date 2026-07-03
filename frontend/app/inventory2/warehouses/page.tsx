'use client';

import { useRouter } from 'next/navigation';
import { useWarehouses } from '@/hooks/inventory2/useWarehouses';
import { WarehousesHeader } from '@/components/inventory2/warehouses/WarehousesHeader';
import { WarehouseCard } from '@/components/inventory2/warehouses/WarehouseCard';
import { WarehouseModal } from '@/components/inventory2/warehouses/WarehouseModal';
import { Warehouse as WarehouseIcon } from 'lucide-react';

export default function WarehousesPage() {
  const router = useRouter();
  const h = useWarehouses();

  return (
    <>
      <WarehousesHeader total={h.items.length} search={h.search} onSearchChange={h.setSearch}
        onInit={h.handleInit} onAdd={h.openNew} />

      {h.loading ? (
        <div className="px-8 text-center text-slate-400 py-20">جاري التحميل...</div>
      ) : h.filtered.length === 0 ? (
        <div className="px-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-16 text-center">
            <WarehouseIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">لا توجد مخازن</p>
            <div className="flex gap-3 justify-center">
              <button onClick={h.handleInit} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">تهيئة المخازن الافتراضية</button>
              <button onClick={h.openNew} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">إضافة مخزن يدوياً</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {h.filtered.map((w) => (
              <WarehouseCard key={w.id} warehouse={w} stockCount={h.stockCounts[w.id]}
                onOpen={(id) => router.push(`/inventory2/warehouses/${id}`)}
                onEdit={h.openEdit} onDelete={h.handleDelete} />
            ))}
          </div>
        </div>
      )}

      <WarehouseModal isOpen={h.showModal} editing={!!h.editing} form={h.form} saving={h.saving}
        onClose={() => h.setShowModal(false)} onFormChange={h.setForm} onSave={h.handleSave} />
    </>
  );
}
