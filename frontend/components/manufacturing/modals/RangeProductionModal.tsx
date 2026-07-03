'use client';

import type { Machine, Mold, RawMaterial } from '@/components/manufacturing/types';
import { Pencil, Calendar, X } from 'lucide-react';

interface RangeProductionModalProps {
  show: boolean;
  editingSessionId: number | null;
  rangeForm: {
    machine_id: string; machine_name: string; mold_id: string; product_id: string;
    start_date: string; end_date: string; total_production_kg: string;
    mode: 'sum' | 'distribute'; hours_worked: number; notes: string;
  };
  machines: Machine[];
  molds: Mold[];
  rawMaterials: RawMaterial[];
  loading: boolean;
  getWorkingDays: (start: string, end: string) => string[];
  onClose: () => void;
  onFormChange: (form: RangeProductionModalProps['rangeForm']) => void;
  onSave: () => void;
}

export default function RangeProductionModal({
  show, editingSessionId, rangeForm, machines, molds, rawMaterials,
  loading, getWorkingDays, onClose, onFormChange, onSave,
}: RangeProductionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">
            {editingSessionId ? <span className="flex items-center gap-2"><Pencil /> تعديل إنتاج فترة</span> : <span className="flex items-center gap-2"><Calendar /> تسجيل إنتاج فترة</span>}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm text-slate-400 mb-1">الماكينة</label>
            <select
              value={rangeForm.machine_id}
              onChange={(e) => {
                const m = machines.find(m => m.id === Number(e.target.value));
                onFormChange({ ...rangeForm, machine_id: e.target.value, machine_name: m?.name || '' });
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
            >
              <option value="">اختر ماكينة</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">الإسطمبة</label>
            <select
              value={rangeForm.mold_id}
              onChange={(e) => onFormChange({ ...rangeForm, mold_id: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
            >
              <option value="">اختر إسطمبة</option>
              {molds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">الخامة</label>
            <select
               value={rangeForm.product_id}
               onChange={(e) => onFormChange({ ...rangeForm, product_id: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
            >
              <option value="">اختر خامة</option>
              {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.product?.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">تاريخ البداية</label>
              <input
                type="date"
                value={rangeForm.start_date}
                onChange={(e) => onFormChange({ ...rangeForm, start_date: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">تاريخ النهاية</label>
              <input
                type="date"
                value={rangeForm.end_date}
                onChange={(e) => onFormChange({ ...rangeForm, end_date: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">إجمالي الإنتاج (كجم) للفترة</label>
            <input
              type="number"
              value={rangeForm.total_production_kg}
              onChange={(e) => onFormChange({ ...rangeForm, total_production_kg: e.target.value })}
              placeholder="0.0"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white font-bold text-blue-400"
            />
            {rangeForm.mode === 'distribute' && rangeForm.total_production_kg && rangeForm.start_date && rangeForm.end_date && (
              <span className="text-xs text-green-400 mt-1 block">
                {(() => {
                  const workingDays = getWorkingDays(rangeForm.start_date, rangeForm.end_date);
                  const fridays = Math.ceil(
                    (new Date(rangeForm.end_date).getTime() - new Date(rangeForm.start_date).getTime()) / (1000 * 60 * 60 * 24)
                  ) + 1 - workingDays.length;
                  return `عدد أيام العمل: ${workingDays.length} يوم${fridays > 0 ? ` (تم استبعاد ${fridays} جمعة)` : ''} | ${(Number(rangeForm.total_production_kg) / workingDays.length).toFixed(2)} كجم/يوم`;
                })()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">ساعات العمل</label>
              <input
                type="number"
                value={rangeForm.hours_worked}
                onChange={(e) => onFormChange({ ...rangeForm, hours_worked: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">طريقة الحفظ</label>
              <select
                value={rangeForm.mode}
                onChange={(e) => onFormChange({ ...rangeForm, mode: e.target.value as 'sum' | 'distribute' })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
              >
                <option value="distribute">توزيع على أيام العمل</option>
                <option value="sum">كدفعة واحدة (تاريخ النهاية)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
            <input
              type="text"
              value={rangeForm.notes}
              onChange={(e) => onFormChange({ ...rangeForm, notes: e.target.value })}
              placeholder="..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-bold transition">
            إلغاء
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
