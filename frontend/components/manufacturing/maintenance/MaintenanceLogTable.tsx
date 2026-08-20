'use client';

import type { MaintenanceLog } from '@/components/manufacturing/maintenance/types';
import { ScrollText } from 'lucide-react';

interface MaintenanceLogTableProps {
  logs: MaintenanceLog[];
}

const statusConfig: Record<string, { text: string; className: string }> = {
  COMPLETED: { text: 'مكتمل', className: 'bg-green-500/10 text-green-400' },
  IN_PROGRESS: { text: 'جاري العمل', className: 'bg-emerald-500/10 text-blue-400' },
  PENDING: { text: 'قيد الانتظار', className: 'bg-amber-500/10 text-amber-400' },
};

export function MaintenanceLogTable({ logs }: MaintenanceLogTableProps) {
  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold flex items-center gap-2"><ScrollText /> سجل العمليات السابقة</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5">
            <tr>
              <th className="p-4 text-slate-400">التاريخ</th>
              <th className="p-4 text-slate-400">الماكينة</th>
              <th className="p-4 text-slate-400">النوع</th>
              <th className="p-4 text-slate-400">الوصف</th>
              <th className="p-4 text-slate-400">التكلفة</th>
              <th className="p-4 text-slate-400">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const cfg = statusConfig[log.status] || { text: log.status, className: 'bg-white/5 text-slate-400' };
              return (
                <tr key={log.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">{new Date(log.date).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 font-bold">{log.machine?.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs">{log.type}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{log.description}</td>
                  <td className="p-4 font-bold">{Number(log.cost).toLocaleString()} ج.م</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.className}`}>{cfg.text}</span>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-[#ecfdf5]0">لا يوجد سجل صيانة حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
