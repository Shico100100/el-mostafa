'use client';

import { useAttendance } from '@/hooks/assembly/useAttendance';
import { AttendanceHeader } from '@/components/assembly/attendance/AttendanceHeader';
import { AttendanceTable } from '@/components/assembly/attendance/AttendanceTable';
import { AttendanceModal } from '@/components/assembly/attendance/AttendanceModal';

export default function AttendancePage() {
  const h = useAttendance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <AttendanceHeader date={h.date} onDateChange={h.setDate} onNewRecord={h.openNew} />

      <main className="container mx-auto px-6 py-8">
        {h.loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <AttendanceTable attendance={h.attendance} onEdit={h.openEdit} onDelete={h.handleDelete} />
        )}
      </main>

      <AttendanceModal
        show={h.showModal}
        editingRecord={h.editingRecord}
        workers={h.workers}
        onSave={h.handleSave}
        onClose={h.closeModal}
      />
    </div>
  );
}
