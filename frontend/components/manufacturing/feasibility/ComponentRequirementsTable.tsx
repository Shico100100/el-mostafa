'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { ComponentRequirement } from '@/components/manufacturing/feasibility/types';

interface ComponentRequirementsTableProps {
  components: ComponentRequirement[];
}

const statusColor = (s: string) => {
  switch (s) {
    case 'OK': return 'bg-green-500/20 text-green-300';
    case 'SHORTAGE': return 'bg-red-500/20 text-red-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};
const statusText = (s: string) => {
  switch (s) {
    case 'OK': return 'جيد';
    case 'SHORTAGE': return 'عجز';
    default: return s;
  }
};

export function ComponentRequirementsTable({ components }: ComponentRequirementsTableProps) {
  return (
    <GlassPanel title="احتياجات المواد والمكونات">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-right px-4 py-3">المكون</th>
              <th className="text-center px-4 py-3">الوحدة</th>
              <th className="text-center px-4 py-3">المطلوب</th>
              <th className="text-center px-4 py-3">المخزون الحالي</th>
              <th className="text-center px-4 py-3">العجز</th>
              <th className="text-center px-4 py-3">الحالة</th>
              <th className="text-center px-4 py-3">اقتراح التوريد</th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp) => (
              <tr key={comp.productId} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3 text-white font-medium">{comp.productName}</td>
                <td className="px-4 py-3 text-center text-gray-400">{comp.unit}</td>
                <td className="px-4 py-3 text-center text-orange-400">{comp.required.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-blue-400">{comp.currentStock.toLocaleString()}</td>
                <td className={`px-4 py-3 text-center font-bold ${comp.shortage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {comp.shortage > 0 ? comp.shortage.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor(comp.status)}`}>
                    {statusText(comp.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-300">
                  {comp.procurementSuggestion ? (
                    <div>
                      <div>{comp.procurementSuggestion.preferredSupplierName || '—'}</div>
                      <div className="text-amber-400">
                        كمية: {comp.procurementSuggestion.suggestedOrderQty?.toLocaleString()}
                      </div>
                      <div className="text-gray-500">
                        مهلة: {comp.procurementSuggestion.leadTimeDays} يوم
                      </div>
                    </div>
                  ) : (
                    <span className="text-green-400">متوفر</span>
                  )}
                </td>
              </tr>
            ))}
            {components.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد مكونات مطلوبة</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
