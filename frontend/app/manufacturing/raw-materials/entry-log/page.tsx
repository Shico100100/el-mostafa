'use client';

import { useEntryLog } from '@/hooks/manufacturing/useEntryLog';
import { EntryLogHeader } from '@/components/manufacturing/entry-log/EntryLogHeader';
import { PeriodFilter } from '@/components/manufacturing/entry-log/PeriodFilter';
import { MovementsTable } from '@/components/manufacturing/entry-log/MovementsTable';
import { EditMovementDialog } from '@/components/manufacturing/entry-log/EditMovementDialog';

export default function EntryLogPage() {
  const h = useEntryLog();

  if (h.loading) return <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <EntryLogHeader />
      <main className="container mx-auto px-6 py-8">
        <PeriodFilter value={h.filterPeriod} onChange={h.setFilterPeriod} />
        <MovementsTable movements={h.movements} onEdit={h.handleEdit} onDelete={h.handleDelete} />
      </main>
      <EditMovementDialog
        show={h.showEditDialog}
        editForm={h.editForm}
        onFormChange={h.setEditForm}
        onSave={h.handleSaveEdit}
        onClose={() => { h.setShowEditDialog(false); h.setEditingMovement(null); }}
      />
    </div>
  );
}
