'use client';

import type { Machine } from '@/components/manufacturing/maintenance/types';
import { Calendar } from 'lucide-react';

interface MachineScheduleTableProps {
  machines: Machine[];
  onScheduleMaintenance: (machineId: number) => void;
}

export function MachineScheduleTable({ machines, onScheduleMaintenance }: MachineScheduleTableProps) {
  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar /> جدول الصيانة القادمة</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5">
            <tr>
              <th className="p-4 text-slate-400">الماكينة</th>
              <th className="p-4 text-slate-400">آخر صيانة</th>
              <th className="p-4 text-slate-400">الصيانة القادمة</th>
              <th className="p-4 text-slate-400">الحالة</th>
              <th className="p-4 text-slate-400">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => {
              const nextDate = machine.next_maintenance ? new Date(machine.next_maintenance) : null;
              const isOverdue = nextDate && nextDate < new Date();
              return (
                <tr key={machine.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold">{machine.name}</td>
                  <td className="p-4">
                    {machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString('ar-EG') : '---'}
                  </td>
                  <td className="p-4">
                    <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      machine.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                      machine.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onScheduleMaintenance(machine.id)}
                      className="text-blue-400 hover:text-blue-300 font-bold">تسجيل صيانة</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
