'use client';

import type { AuditLog } from '@/hooks/audit/useAuditLog';

interface AuditTableProps {
  logs: AuditLog[];
  loading: boolean;
  formatAction: (action: string) => string;
}

export function AuditTable({ logs, loading, formatAction }: AuditTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="text-slate-500 text-sm border-b border-white/10">
            <th className="px-6 py-4 font-bold">المستخدم</th>
            <th className="px-6 py-4 font-bold">العملية</th>
            <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
            <th className="px-6 py-4 font-bold">التفاصيل</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">جاري التحميل...</td></tr>
          ) : logs.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">لا توجد سجلات مسجلة</td></tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                      {log.user?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{log.user?.firstName} {log.user?.lastName}</p>
                      <p className="text-xs text-slate-500">{log.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                    log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {formatAction(log.action)}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400 font-medium font-mono">
                  {new Date(log.created_at).toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400" title={log.details}>
                    {log.details || 'بدون تفاصيل إضافية'}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
