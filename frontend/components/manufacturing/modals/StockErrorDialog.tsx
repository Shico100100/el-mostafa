'use client';

import type { NormalizedProductionItem } from '@/components/manufacturing/types';
import { AlertTriangle } from 'lucide-react';

interface StockErrorItem {
  bulkIndex: number;
  normalized: NormalizedProductionItem;
  error: Error;
}

interface StockErrorDialogProps {
  show: boolean;
  error: { items: StockErrorItem[] } | null;
  rawMaterialNames: Record<number, string>;
  onAllowNegative: () => void;
  onSubstitute: () => void;
  onCancel: () => void;
}

export default function StockErrorDialog({
  show, error, rawMaterialNames, onAllowNegative, onSubstitute, onCancel,
}: StockErrorDialogProps) {
  if (!show || !error) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border border-amber-500/50 mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2"><AlertTriangle /> رصيد غير كافٍ</h2>
        <p className="text-gray-300 mb-2">العناصر التالية لا تحتوي على رصيد كافٍ من الخامة:</p>
        <ul className="text-sm text-gray-400 mb-6 space-y-1 max-h-32 overflow-y-auto">
          {error.items.map((item, idx) => (
            <li key={idx} className="bg-slate-900/50 p-2 rounded">
              ماكينة {item.normalized.machine_name || idx + 1}
              {' — '}
              خامة: {rawMaterialNames[item.normalized.product_id ?? -1] || `#${item.normalized.product_id}`}
              {' — '}
              المطلوب: {item.normalized.total_production_kg} كجم
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <button onClick={onAllowNegative} className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition">
            الحفظ بالرصيد السالب
          </button>
          <button onClick={onSubstitute} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
            استبدال الخامة بأخرى
          </button>
          <button onClick={onCancel} className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
