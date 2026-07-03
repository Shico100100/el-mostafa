'use client';

import type { PayrollPayment } from '@/components/hr/payroll/types';

interface HistoryTabProps {
  month: string;
  payments: PayrollPayment[];
}

export function HistoryTab({ month, payments }: HistoryTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">الرواتب المصروفة لشهر {month}</h2>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">الموظف</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">تاريخ الصرف</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا يوجد مدفوعات مسجلة لهذا الشهر بعد</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-white/5 transition">
                <td className="p-4 font-bold">{p.user?.firstName} {p.user?.lastName}</td>
                <td className="p-4 font-mono text-emerald-400 font-bold">{Number(p.net_salary).toLocaleString()} ج.م</td>
                <td className="p-4 text-sm">{p.payment_date}</td>
                <td className="p-4"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">تم الدفع</span></td>
                <td className="p-4 text-gray-400 text-sm">{p.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
