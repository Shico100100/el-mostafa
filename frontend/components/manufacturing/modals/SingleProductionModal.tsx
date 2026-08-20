'use client';

import type { Machine, Mold, RawMaterial, BulkProductionItem } from '@/components/manufacturing/types';
import { X } from 'lucide-react';

interface SingleProductionModalProps {
  show: boolean;
  machine: Machine | null;
  form: BulkProductionItem;
  molds: Mold[];
  rawMaterials: RawMaterial[];
  loading: boolean;
  onClose: () => void;
  onFieldChange: (field: keyof BulkProductionItem, value: string | number) => void;
  onSave: () => void;
}

export default function SingleProductionModal({
  show, machine, form, molds, rawMaterials, loading, onClose, onFieldChange, onSave,
}: SingleProductionModalProps) {
  if (!show || !machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">إضافة إنتاج — {machine.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">الإسطمبة</label>
            <select
              value={form.mold_id}
              onChange={(e) => onFieldChange('mold_id', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-emerald-500 text-white"
            >
              <option value="">اختر إسطمبة</option>
              {molds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">الخامة</label>
            <select
               value={form.product_id}
                  onChange={(e) => onFieldChange('product_id', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-emerald-500 text-white"
            >
              <option value="">اختر خامة</option>
              {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.product?.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">ساعات العمل</label>
            <input
              type="number"
              value={form.hours_worked}
              onChange={(e) => onFieldChange('hours_worked', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-emerald-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">الإنتاج (كجم)</label>
            <input
              type="number"
              value={form.total_production_kg}
              onChange={(e) => onFieldChange('total_production_kg', e.target.value)}
              placeholder="0.0"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-emerald-500 text-white font-bold text-blue-400"
            />
            {form.mold_id && form.total_production_kg && (
              <span className="text-xs text-green-400 mt-1 block">
                ~ {Math.floor((Number(form.total_production_kg) * 1000) / Number(molds.find(m => m.id === Number(form.mold_id))?.product_weight || 1))} ق
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-emerald-500 text-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
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
