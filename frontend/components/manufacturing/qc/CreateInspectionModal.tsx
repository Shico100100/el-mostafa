'use client';

import type { PendingProduction } from '@/components/manufacturing/qc/types';

interface Props {
  show: boolean;
  saving: boolean;
  pending: PendingProduction[];
  selectedProductionId: number | '';
  inspectionStatus: 'PASS' | 'FAIL';
  defectsCount: number;
  notes: string;
  onClose: () => void;
  onProductionChange: (id: number | '') => void;
  onStatusChange: (s: 'PASS' | 'FAIL') => void;
  onDefectsChange: (n: number) => void;
  onNotesChange: (n: string) => void;
  onSubmit: () => void;
}

export function CreateInspectionModal({
  show, saving, pending, selectedProductionId, inspectionStatus,
  defectsCount, notes, onClose, onProductionChange, onStatusChange,
  onDefectsChange, onNotesChange, onSubmit,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-lg mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">فحص جودة جديد</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">سجل الإنتاج</label>
            <select
              value={selectedProductionId}
              onChange={(e) => onProductionChange(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm"
            >
              <option value="">اختر سجل إنتاج...</option>
              {pending.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.machine?.name || `#${p.id}`} — {p.mold?.name || ''} ({p.pieces_produced} قطعة)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">النتيجة</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onStatusChange('PASS')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${inspectionStatus === 'PASS' ? 'bg-green-600 text-white' : 'bg-slate-700 text-gray-300'}`}
              >
                ناجح
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('FAIL')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${inspectionStatus === 'FAIL' ? 'bg-red-600 text-white' : 'bg-slate-700 text-gray-300'}`}
              >
                راسب
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">عدد القطع التالفة</label>
            <input
              type="number"
              value={defectsCount}
              onChange={(e) => onDefectsChange(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition text-sm">
            إلغاء
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !selectedProductionId}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg transition text-sm"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الفحص'}
          </button>
        </div>
      </div>
    </div>
  );
}
