'use client';

import type { PayrollProfile } from '@/components/hr/payroll/types';

interface ProfilesTabProps {
  profiles: PayrollProfile[];
  onAdd: () => void;
}

export function ProfilesTab({ profiles, onAdd }: ProfilesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">رواتب الموظفين الأساسية</h2>
        <button onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2">
          <span>+</span> تحديث راتب موظف
        </button>
      </div>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">الموظف</th>
              <th className="p-4">الراتب الأساسي</th>
              <th className="p-4">ساعات العمل</th>
              <th className="p-4">معدل الإضافي</th>
              <th className="p-4">معدل الخصم</th>
              <th className="p-4">تاريخ التحديث</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-white/5 transition">
                <td className="p-4">
                  <div className="font-bold">{p.user?.firstName} {p.user?.lastName}</div>
                  <div className="text-xs text-gray-500">{p.user?.email}</div>
                </td>
                <td className="p-4 font-mono text-emerald-400 font-bold">{Number(p.base_salary).toLocaleString()} ج.م</td>
                <td className="p-4">{p.working_hours_per_day} ساعة</td>
                <td className="p-4">{p.overtime_rate}x</td>
                <td className="p-4">{p.deduction_rate}x</td>
                <td className="p-4 text-xs text-gray-400">{new Date(p.updated_at).toLocaleDateString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
