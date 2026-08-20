'use client';

import type { Movement } from '@/components/manufacturing/entry-log/types';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  movements: Movement[];
  onEdit: (m: Movement) => void;
  onDelete: (id: number) => void;
}

export function MovementsTable({ movements, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5 text-gray-300 text-sm uppercase font-semibold">
          <tr>
            <th className="px-6 py-4 text-right">التاريخ</th>
            <th className="px-6 py-4 text-right">المادة الخام</th>
            <th className="px-6 py-4 text-right">الكمية</th>
            <th className="px-6 py-4 text-right">السعر</th>
            <th className="px-6 py-4 text-right">ملاحظات</th>
            <th className="px-6 py-4 text-right">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-gray-300">
          {movements.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">لا توجد سجلات</td></tr>
          ) : (
            movements.map((mov) => (
              <tr key={mov.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4">{new Date(mov.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-6 py-4 font-bold text-white">{mov.product_name}</td>
                <td className="px-6 py-4 font-mono text-green-400">+{mov.quantity}</td>
                <td className="px-6 py-4 font-mono text-yellow-400">{mov.price ? mov.price.toFixed(2) : '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{mov.notes}</td>
                <td className="px-6 py-4 flex gap-2 justify-end">
                  <button onClick={() => onEdit(mov)} className="p-2 bg-emerald-500/10 text-blue-400 rounded hover:bg-emerald-500/20"><Pencil /></button>
                  <button onClick={() => onDelete(mov.id)} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><Trash2 /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
