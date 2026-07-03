'use client';

import type { Machine, Mold, RawMaterial, BulkProductionItem } from '@/components/manufacturing/types';
import { X } from 'lucide-react';

interface BulkProductionModalProps {
  show: boolean;
  isEditMode: boolean;
  date: string;
  bulkData: BulkProductionItem[];
  molds: Mold[];
  rawMaterials: RawMaterial[];
  weeklyMoldAvg: Record<number, number>;
  moldStats: Record<number, number>;
  loading: boolean;
  onClose: () => void;
  onBulkChange: (index: number, field: keyof BulkProductionItem, value: string | number) => void;
  onSave: (goToNextDay: boolean) => void;
}

export default function BulkProductionModal({
  show, isEditMode, date, bulkData, molds, rawMaterials,
  weeklyMoldAvg, moldStats, loading,
  onClose, onBulkChange, onSave,
}: BulkProductionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditMode ? `تعديل إنتاج الماكينات - ${date}` : `تسجيل إنتاج الماكينات - ${date}`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-right">
            <thead className="text-slate-400 text-sm">
              <tr>
                <th className="pb-4 px-2">الماكينة</th>
                <th className="pb-4 px-2">الإسطمبة</th>
                <th className="pb-4 px-2">الخامة</th>
                <th className="pb-4 px-2">ساعات العمل</th>
                <th className="pb-4 px-2">الإنتاج (كجم)</th>
                <th className="pb-4 px-2">المتوسط</th>
                <th className="pb-4 px-2">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {bulkData.map((item, index) => (
                <tr key={item.machine_id} className="border-t border-slate-700/50">
                  <td className="py-4 px-2 font-bold">{item.machine_name}</td>
                  <td className="py-4 px-2">
                    <select
                      value={item.mold_id}
                      onChange={(e) => onBulkChange(index, 'mold_id', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">اختر إسطمبة</option>
                      {molds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => onBulkChange(index, 'product_id', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">اختر خامة</option>
                      {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.product?.name}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2">
                    <input
                      type="number"
                      value={item.hours_worked}
                      onChange={(e) => onBulkChange(index, 'hours_worked', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-20 text-center outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        value={item.total_production_kg}
                        onChange={(e) => onBulkChange(index, 'total_production_kg', e.target.value)}
                        placeholder="0.0"
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-24 text-center outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-400"
                      />
                      {item.mold_id && item.total_production_kg && (
                        <span className="text-[10px] text-green-400 text-center font-bold">
                          ~ {Math.floor((Number(item.total_production_kg) * 1000) / Number(molds.find(m => m.id === Number(item.mold_id))?.product_weight || 1))} ق
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-xs text-slate-400">
                    {item.mold_id && (weeklyMoldAvg[Number(item.mold_id)] !== undefined || moldStats[Number(item.mold_id)] !== undefined) ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded ${Number(item.total_production_kg) >= Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]).toFixed(1)} كجم
                        </span>
                        {item.total_production_kg && (
                          <span className={`text-[10px] font-bold ${Number(item.total_production_kg) >= Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                            {((Number(item.total_production_kg) - Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)])) / Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-2">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => onBulkChange(index, 'notes', e.target.value)}
                      placeholder="..."
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-4 bg-slate-800/50">
          <button
            onClick={() => onSave(false)}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
          >
            حفظ فقط
          </button>
          <button
            onClick={() => onSave(true)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />}
            حفظ والانتقال لليوم التالي
          </button>
        </div>
      </div>
    </div>
  );
}
