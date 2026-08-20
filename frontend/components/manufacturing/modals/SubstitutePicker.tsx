'use client';

import type { RawMaterial, NormalizedProductionItem } from '@/components/manufacturing/types';

interface StockErrorItem {
  bulkIndex: number;
  normalized: NormalizedProductionItem;
  error: Error;
}

interface SubstitutePickerProps {
  show: boolean;
  rawMaterials: RawMaterial[];
  stockError: { items: StockErrorItem[] } | null;
  onSelect: (materialId: number) => void;
  onClose: () => void;
}

export default function SubstitutePicker({
  show, rawMaterials, stockError, onSelect, onClose,
}: SubstitutePickerProps) {
  if (!show) return null;

  const excludedIds = new Set(stockError?.items.map(i => i.normalized.product_id) || []);
  const available = rawMaterials.filter(rm => !excludedIds.has(rm.id));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">اختر خامة بديلة</h2>
        <p className="text-sm text-gray-400 mb-4">
          سيتم استخدام الخامة البديلة لجميع العناصر الفاشلة بدلاً من الخامة الأصلية.
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {available.map(rm => (
            <button
              key={rm.id}
              onClick={() => onSelect(rm.id)}
              className="w-full text-right px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-white transition"
            >
              {rm.product?.name || `خامة #${rm.id}`}
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-[#ecfdf5]0 text-center py-4">لا توجد خامات بديلة متاحة</p>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition">
          إلغاء
        </button>
      </div>
    </div>
  );
}
