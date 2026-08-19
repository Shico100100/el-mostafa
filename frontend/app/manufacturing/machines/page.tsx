'use client';

import { useSetBackButton } from '@/components/BackButton';
import { useMachines } from '@/hooks/manufacturing/useMachines';
import { MachinesHeader } from '@/components/manufacturing/machines/MachinesHeader';
import { MachineFilters } from '@/components/manufacturing/machines/MachineFilters';
import { MaintenanceAlert } from '@/components/manufacturing/machines/MaintenanceAlert';
import { MachineCard } from '@/components/manufacturing/machines/MachineCard';
import { MachinePagination } from '@/components/manufacturing/machines/MachinePagination';
import { AddEditMachineDialog } from '@/components/manufacturing/machines/AddEditMachineDialog';

export default function MachinesPage() {
  useSetBackButton('/manufacturing');
  const m = useMachines();

  if (m.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <MachinesHeader onImportSuccess={() => m.loadMachines()} />

      <main className="container mx-auto px-6 py-8">
        <MachineFilters
          searchQuery={m.searchQuery} statusFilter={m.statusFilter}
          onSearchChange={m.handleSearchChange} onStatusChange={m.handleStatusChange}
          onAdd={() => { m.setEditingMachine(null); m.setFormError(null); m.setFormErrors({}); m.setShowModal(true); }}
        />

        <MaintenanceAlert
          overdueCount={m.overdueCount}
          machines={m.overdueMachines}
          getMaintenanceDays={m.getMaintenanceDays}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {m.machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onEdit={(mac) => { m.setEditingMachine(mac); m.setFormError(null); m.setFormErrors({}); m.setShowModal(true); }}
              getStatusColor={m.getStatusColor}
              getStatusText={m.getStatusText}
              getMaintenanceDays={m.getMaintenanceDays}
            />
          ))}
          {m.machines.length === 0 && (
            <div className="col-span-full text-center text-[#6b8378] py-12">
              {m.searchQuery || m.statusFilter ? 'لا توجد نتائج للبحث' : 'لا توجد ماكينات. قم بإضافة ماكينة جديدة.'}
            </div>
          )}
        </div>

        <MachinePagination currentPage={m.currentPage} totalPages={m.totalPages} onPageChange={m.setCurrentPage} />
      </main>

      <AddEditMachineDialog
        visible={m.showModal}
        editingMachine={m.editingMachine}
        formError={m.formError}
        formErrors={m.formErrors}
        onSubmit={m.handleSubmit}
        onClose={() => { m.setShowModal(false); m.setEditingMachine(null); m.setFormError(null); m.setFormErrors({}); }}
      />
    </div>
  );
}
