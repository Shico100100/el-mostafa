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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
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
            <div className="col-span-full text-center text-gray-400 py-12">
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
