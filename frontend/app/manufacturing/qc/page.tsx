'use client';

import { useQC } from '@/hooks/manufacturing/useQC';
import { QCHeader } from '@/components/manufacturing/qc/QCHeader';
import { QCStatsCards } from '@/components/manufacturing/qc/QCStatsCards';
import { QCSearchFilter } from '@/components/manufacturing/qc/QCSearchFilter';
import { PendingInspections } from '@/components/manufacturing/qc/PendingInspections';
import { RecentInspectionsTable } from '@/components/manufacturing/qc/RecentInspectionsTable';
import { CreateInspectionModal } from '@/components/manufacturing/qc/CreateInspectionModal';

export default function QcPage() {
  const h = useQC();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <QCHeader onNewInspection={() => h.setShowCreateModal(true)} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        {h.loading ? (
          <div className="text-center text-white py-12">جاري التحميل...</div>
        ) : (
          <>
            <QCStatsCards stats={h.stats} />

            <QCSearchFilter
              searchQuery={h.searchQuery}
              statusFilter={h.statusFilter}
              onSearchChange={h.setSearchQuery}
              onStatusChange={h.setStatusFilter}
            />

            <PendingInspections pending={h.pending} />

            <RecentInspectionsTable items={h.filteredRecent} total={h.recent.length} />
          </>
        )}
      </main>

      <CreateInspectionModal
        show={h.showCreateModal}
        saving={h.saving}
        pending={h.pending}
        selectedProductionId={h.selectedProductionId}
        inspectionStatus={h.inspectionStatus}
        defectsCount={h.defectsCount}
        notes={h.notes}
        onClose={() => { h.setShowCreateModal(false); h.resetForm(); }}
        onProductionChange={h.setSelectedProductionId}
        onStatusChange={h.setInspectionStatus}
        onDefectsChange={h.setDefectsCount}
        onNotesChange={h.setNotes}
        onSubmit={h.handleCreateInspection}
      />
    </div>
  );
}
