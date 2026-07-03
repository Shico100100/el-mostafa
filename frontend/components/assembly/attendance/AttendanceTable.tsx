'use client';

import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { translateStatus, getStatusColor } from '@/components/assembly/attendance/types';
import type { AttendanceRecord } from '@/components/assembly/attendance/types';

interface Props {
  attendance: AttendanceRecord[];
  onEdit: (r: AttendanceRecord) => void;
  onDelete: (id: number) => void;
}

export function AttendanceTable({ attendance, onEdit, onDelete }: Props) {
  if (attendance.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
        <span className="text-6xl block mb-4"><Calendar className="w-16 h-16 mx-auto text-gray-500" /></span>
        <h3 className="text-xl font-bold text-gray-400">لا يوجد سجلات حضور لهذا اليوم</h3>
        <p className="text-gray-500 mt-2 text-sm">اضغط على زر &quot;تسجيل جديد&quot; للبدء</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
      <table className="w-full text-right border-collapse min-w-[800px]">
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">الموظف</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">الحالة</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">الحضور</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">الانصراف</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">ملاحظات</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {attendance.map((row) => (
            <tr key={row.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold">{row.user?.firstName} {row.user?.lastName}</div>
                <div className="text-xs text-gray-500">{row.user?.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(row.status)}`}>
                  {translateStatus(row.status)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-mono">{row.check_in || '--:--'}</td>
              <td className="px-6 py-4 text-sm font-mono">{row.check_out || '--:--'}</td>
              <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{row.notes || '-'}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(row)} className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(row.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
