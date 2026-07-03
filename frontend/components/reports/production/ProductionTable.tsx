'use client';

import type { ProductionRecord } from '@/hooks/reports/useProductionReport';

interface ProductionTableProps {
  data: ProductionRecord[];
  onDelete: (id: number) => void;
}

export function ProductionTable({ data, onDelete }: ProductionTableProps) {
  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="p-4">التاريخ</th>
              <th className="p-4">الماكينة</th>
              <th className="p-4">المنتج (الاسطمبة)</th>
              <th className="p-4">الخامة</th>
              <th className="p-4">الإنتاج (كجم)</th>
              <th className="p-4">القطع المنتجة</th>
              <th className="p-4">توقف</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                <td className="p-4">{item.machine?.name || '-'}</td>
                <td className="p-4">{item.mold?.name || '-'}</td>
                <td className="p-4">{item.raw_material?.name || '-'}</td>
                <td className="p-4 font-bold text-blue-400">{Number(item.total_production_kg || 0).toFixed(2)}</td>
                <td className="p-4 font-bold text-green-400">{item.pieces_produced || 0}</td>
                <td className="p-4 text-red-300">{item.downtime_minutes ? `${item.downtime_minutes} دقيقة` : '-'}</td>
                <td className="p-4">
                  <button onClick={() => onDelete(item.id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition text-sm">
                    حذف
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
