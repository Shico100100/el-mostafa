'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { Container } from '@/components/purchases/containers/types';

interface ReorderSuggestionsProps {
  containers: Container[];
  reorderContainerId: string;
  reorderResults: Record<string, unknown> | null;
  reorderLoading: boolean;
  onContainerChange: (v: string) => void;
  onCalculate: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function ReorderSuggestions({ containers, reorderContainerId, reorderResults, reorderLoading, onContainerChange, onCalculate }: ReorderSuggestionsProps) {
  const suggestions = reorderResults?.suggestions as Array<Record<string, unknown>> | undefined;

  return (
    <GlassPanel title="اقتراحات إعادة الطلب الذكية">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>اختر الحاوية</label>
            <select className={inputClass} value={reorderContainerId} onChange={e => onContainerChange(e.target.value)}>
              <option value="">-- اختر --</option>
              {containers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({Number(c.max_cbm).toFixed(3)} CBM)</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={onCalculate} disabled={reorderLoading || !reorderContainerId}
              className="w-full px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/30 transition disabled:opacity-50">
              {reorderLoading ? '...' : 'اقتراح إعادة الطلب'}
            </button>
          </div>
        </div>

        {reorderResults && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-lg font-bold text-cyan-400 mb-1">
                المساحة المتبقية: {(reorderResults.remaining_cbm as number).toFixed(3)} CBM
              </div>
              <div className="text-sm text-gray-400">
                عدد الاقتراحات: {(suggestions || []).length}
              </div>
            </div>

            {suggestions && suggestions.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="text-right px-4 py-3">المنتج</th>
                    <th className="text-right px-4 py-3">SKU</th>
                    <th className="text-center px-4 py-3">النوع</th>
                    <th className="text-center px-4 py-3">CBM/وحدة</th>
                    <th className="text-center px-4 py-3">الحد الأقصى</th>
                    <th className="text-center px-4 py-3">مقترح</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s: Record<string, unknown>) => (
                    <tr key={s.product_id as number} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white font-medium">{s.product_name as string}</td>
                      <td className="px-4 py-3 text-gray-400">{s.sku as string || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                          {s.type as string === 'RAW' ? 'خام' : s.type as string === 'FINISHED' ? 'نهائي' : s.type as string === 'SEMI' ? 'نصف مصنع' : 'ملحق'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{(s.estimated_cbm_per_unit as number).toFixed(6)}</td>
                      <td className="px-4 py-3 text-center text-amber-400 font-bold">{(s.max_units_fit as number).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-green-400 font-bold">{(s.suggested_qty as number).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
