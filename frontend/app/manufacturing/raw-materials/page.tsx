'use client';

import { useRouter } from 'next/navigation';
import { useRawMaterials } from '@/hooks/manufacturing/useRawMaterials';
import { RawMaterialsHeader } from '@/components/manufacturing/raw-materials/RawMaterialsHeader';
import { RawMaterialsStats } from '@/components/manufacturing/raw-materials/RawMaterialsStats';
import { RawMaterialsToolbar } from '@/components/manufacturing/raw-materials/RawMaterialsToolbar';
import { RawMaterialsTable } from '@/components/manufacturing/raw-materials/RawMaterialsTable';
import { AddEditRawMaterialDialog } from '@/components/manufacturing/raw-materials/AddEditRawMaterialDialog';

export default function RawMaterialsPage() {
  const router = useRouter();
  const rm = useRawMaterials();

  if (rm.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d] flex items-center justify-center" dir="rtl">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <RawMaterialsHeader onBack={() => router.push('/manufacturing')} onImportSuccess={rm.fetchRawMaterials} />

      <main className="container mx-auto px-6 py-8">
        <RawMaterialsStats total={rm.stats.total} lowStock={rm.stats.lowStock} outOfStock={rm.stats.outOfStock} totalValue={rm.stats.totalValue} />
        <RawMaterialsToolbar
          onEntryLog={() => router.push('/manufacturing/raw-materials/entry-log')}
          onConsumption={() => router.push('/manufacturing/raw-materials/consumption')}
          onAdd={rm.openAddDialog}
        />
        <RawMaterialsTable
          materials={rm.sortedMaterials}
          sortConfig={rm.sortConfig}
          onSort={rm.handleSort}
          onEdit={rm.handleEdit}
          onDelete={rm.handleDelete}
          getStockStatusColor={rm.getStockStatusColor}
          getStockStatusText={rm.getStockStatusText}
        />
      </main>

      <AddEditRawMaterialDialog
        visible={rm.showAddDialog}
        isEditing={rm.isEditing}
        formData={rm.formData}
        onFormDataChange={rm.setFormData}
        onSubmit={rm.handleSubmit}
        onClose={() => { rm.setShowAddDialog(false); rm.setFormData({ name: '', unit: 'kg', reorder_point: '' }); rm.setIsEditing(false); rm.setEditingId(null); }}
      />
    </div>
  );
}
