'use client';

import { useRouter } from 'next/navigation';
import { useMaintenance } from '@/hooks/manufacturing/useMaintenance';
import { MaintenanceHeader } from '@/components/manufacturing/maintenance/MaintenanceHeader';
import { MaintenanceStats } from '@/components/manufacturing/maintenance/MaintenanceStats';
import { MachineScheduleTable } from '@/components/manufacturing/maintenance/MachineScheduleTable';
import { MaintenanceLogTable } from '@/components/manufacturing/maintenance/MaintenanceLogTable';
import { AddMaintenanceDialog } from '@/components/manufacturing/maintenance/AddMaintenanceDialog';

export default function MaintenancePage() {
  const router = useRouter();
  const h = useMaintenance();

  if (h.loading) return <div className="p-8 text-white">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#ecfdf5] p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        <MaintenanceHeader onBack={() => router.back()} onAdd={() => h.setShowModal(true)} />
        <MaintenanceStats overdueCount={h.getOverdueCount()} upcomingCount={h.getUpcomingCount()} totalMachines={h.machines.length} />
        <MachineScheduleTable machines={h.machines}
          onScheduleMaintenance={(id) => { h.setFormData({ ...h.formData, machine_id: String(id) }); h.setShowModal(true); }} />
        <MaintenanceLogTable logs={h.maintenanceLogs} />
      </div>
      <AddMaintenanceDialog visible={h.showModal} machines={h.machines} formData={h.formData}
        onFormChange={(data) => h.setFormData({ ...h.formData, ...data })}
        onSubmit={h.handleSubmit} onClose={() => h.setShowModal(false)} />
      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
