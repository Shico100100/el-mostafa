'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { PlasticMaterialSuggestion } from '@/components/manufacturing/feasibility/types';

interface PlasticMaterialsTableProps {
  suggestions: PlasticMaterialSuggestion[];
  onShowHistory: (productId: number, productName: string) => void;
}

export function PlasticMaterialsTable({ suggestions, onShowHistory }: PlasticMaterialsTableProps) {
  return (
    <GlassPanel title="المواد البلاستيكية المطلوبة">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-right px-4 py-3">المنتج المستهدف</th>
              <th className="text-center px-4 py-3">الكمية المطلوبة</th>
              <th className="text-right px-4 py-3">المادة البلاستيكية</th>
              <th className="text-center px-4 py-3">الوحدة</th>
              <th className="text-center px-4 py-3">المطلوب</th>
              <th className="text-center px-4 py-3">أيام التصنيع</th>
              <th className="text-center px-4 py-3">الماكينة المقترحة</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.flatMap((ps) =>
              ps.materials.map((mat, i) => (
                <tr key={`${ps.productId}-${i}`} onClick={() => onShowHistory(ps.productId, ps.productName)} className="border-b border-white/5 hover:bg-white/10 transition cursor-pointer">
                  <td className="px-4 py-3 text-white font-bold">{ps.productName}</td>
                  <td className="px-4 py-3 text-center text-amber-400">{ps.targetQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-white">{mat.materialName}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{mat.unit}</td>
                  <td className="px-4 py-3 text-center text-orange-400 font-bold">{mat.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-cyan-400 font-bold">
                    {ps.estimatedDays !== null ? `${ps.estimatedDays} يوم` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-400">
                    {ps.suggestedMachineName || '—'}
                  </td>
                </tr>
              ))
            )}
            {suggestions.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد مواد بلاستيكية ناقصة</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
