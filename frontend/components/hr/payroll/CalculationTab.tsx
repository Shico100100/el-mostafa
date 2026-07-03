'use client';

import type { CalculationResult } from '@/components/hr/payroll/types';

interface CalculationTabProps {
  month: string;
  results: CalculationResult[];
  onConfirmPayment: (result: CalculationResult) => void;
}

export function CalculationTab({ month, results, onConfirmPayment }: CalculationTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">كشف رواتب شهر {month}</h2>
      </div>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">الموظف</th>
              <th className="p-4 text-center">حضور</th>
              <th className="p-4 text-center">غياب</th>
              <th className="p-4">الأساسي</th>
              <th className="p-4">خصومات</th>
              <th className="p-4 font-bold">صافي الراتب</th>
              <th className="p-4">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((res, i) => (
              <tr key={i} className="hover:bg-white/5 transition">
                <td className="p-4 font-bold">{res.user?.firstName} {res.user?.lastName}</td>
                <td className="p-4 text-center text-emerald-400">{res.attendanceDays}</td>
                <td className="p-4 text-center text-rose-400">{res.absentDays}</td>
                <td className="p-4 font-mono text-sm">{Number(res.baseSalary).toLocaleString()}</td>
                <td className="p-4 font-mono text-rose-400">-{Number(res.deductions).toLocaleString()}</td>
                <td className="p-4 font-mono text-lg font-bold text-white">{Number(res.netSalary).toLocaleString()} ج.م</td>
                <td className="p-4">
                  <button onClick={() => onConfirmPayment(res)}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-600 hover:text-white transition text-sm font-bold">
                    تأكيد الصرف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
