'use client';

import { getCategoryLabel, getMonthName } from '@/components/manufacturing/fixed-costs/types';
import type { FixedCost } from '@/components/manufacturing/fixed-costs/types';
import { Trash2 } from 'lucide-react';

interface Props {
  costs: FixedCost[];
  onDelete: (id: number) => void;
}

export function CostsTable({ costs, onDelete }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <table className="w-full text-right">
        <thead className="bg-white/5 text-gray-300">
          <tr>
            <th className="px-6 py-4">الشهر</th>
            <th className="px-6 py-4">البند</th>
            <th className="px-6 py-4">القيمة</th>
            <th className="px-6 py-4">ملاحظات</th>
            <th className="px-6 py-4">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="text-gray-200 divide-y divide-white/10">
          {costs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                لا توجد مصروفات مسجلة لهذا العام
              </td>
            </tr>
          ) : (
            costs.map((cost) => (
              <tr key={cost.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 text-blue-300">{getMonthName(cost.month)}</td>
                <td className="px-6 py-4 font-medium">{getCategoryLabel(cost.category)}</td>
                <td className="px-6 py-4 font-bold text-green-400">{Number(cost.amount).toFixed(2)} ج.م</td>
                <td className="px-6 py-4 text-gray-400">{cost.notes || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => onDelete(cost.id)} className="text-red-400 hover:text-red-300 transition" title="حذف"><Trash2 /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
