'use client';

import { useRouter } from 'next/navigation';
import { useWarehouses } from '@/hooks/inventory/useWarehouses';
import { WarehousesHeader } from '@/components/inventory/warehouses/WarehousesHeader';
import { WarehouseCard } from '@/components/inventory/warehouses/WarehouseCard';
import { WarehouseModal } from '@/components/inventory/warehouses/WarehouseModal';
import { Warehouse as WarehouseIcon } from 'lucide-react';

export default function WarehousesPage() {
  const router = useRouter();
  const h = useWarehouses();

  return (
    <>
      <WarehousesHeader total={h.items.length} search={h.search} onSearchChange={h.setSearch}
        onInit={h.handleInit} onAdd={h.openNew} />

      {h.loading ? (
        <div className="px-8 text-center text-[#6b8378] py-20">جاري التحميل...</div>
      ) : h.filtered.length === 0 ? (
        <div className="px-8">
          <div className="bg-[#121a16] backdrop-blur rounded-2xl border border-[#1f2d26] p-16 text-center">
            <WarehouseIcon className="w-16 h-16 text-[#6b8378] mx-auto mb-4" />
            <p className="text-[#6b8378] text-lg mb-4">لا توجد مخازن</p>
            <div className="flex gap-3 justify-center">
              <button onClick={h.handleInit} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">تهيئة المخازن الافتراضية</button>
              <button onClick={h.openNew} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">إضافة مخزن يدوياً</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {h.filtered.map((w) => (
              <WarehouseCard key={w.id} warehouse={w} stockCount={h.stockCounts[w.id]}
                onOpen={(id) => router.push(`/inventory/warehouses/${id}`)}
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
