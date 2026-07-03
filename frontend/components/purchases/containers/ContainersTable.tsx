'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { Container } from '@/components/purchases/containers/types';

interface ContainersTableProps {
  containers: Container[];
  onEdit: (c: Container) => void;
  onDelete: (id: number) => void;
}

export function ContainersTable({ containers, onEdit, onDelete }: ContainersTableProps) {
  return (
    <GlassPanel title="أنواع الحاويات القياسية">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 text-sm">
            <th className="text-right px-6 py-4">الاسم</th>
            <th className="text-center px-6 py-4">الأبعاد (سم)</th>
            <th className="text-center px-6 py-4">السعة (CBM)</th>
            <th className="text-center px-6 py-4">الوزن الأقصى (كجم)</th>
            <th className="text-center px-6 py-4">الحالة</th>
            <th className="text-center px-6 py-4">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {containers.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد حاويات مضافة</td></tr>
          ) : (
            containers.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                <td className="px-6 py-4 text-center text-gray-300">{c.length_cm} × {c.width_cm} × {c.height_cm}</td>
                <td className="px-6 py-4 text-center text-amber-400 font-bold">{Number(c.max_cbm).toFixed(3)}</td>
                <td className="px-6 py-4 text-center text-gray-300">{Number(c.max_weight_kg).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${c.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {c.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => onEdit(c)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition">تعديل</button>
                    <button onClick={() => onDelete(c.id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition">حذف</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </GlassPanel>
  );
}
