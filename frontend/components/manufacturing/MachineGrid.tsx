'use client';

import type { Machine, Mold, RawMaterial, ProductionRecord } from '@/components/manufacturing/types';
import { statusColors, statusLabels } from '@/components/manufacturing/types';

interface MachineGridProps {
  machines: Machine[];
  molds: Mold[];
  rawMaterials: RawMaterial[];
  dailyRecords: ProductionRecord[];
  weeklyMoldAvg: Record<number, number>;
  weeklyMachineKg: Record<number, number>;
  moldStats: Record<number, number>;
  onOpenModal: () => void;
  onOpenSingleModal: (machine: Machine) => void;
}

export default function MachineGrid({
  machines, molds, rawMaterials, dailyRecords,
  weeklyMoldAvg, weeklyMachineKg, moldStats,
  onOpenModal, onOpenSingleModal,
}: MachineGridProps) {
  if (machines.length === 0) {
    return <p className="text-[#ecfdf5]0 text-center py-8">لا توجد ماكينات مسجلة</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {machines.map(machine => {
        const record = dailyRecords.find(r => r.machine_id === machine.id);
        const mold = molds.find(m => m.id === (record?.mold_id || machine.last_mold_id));
        const rawMat = rawMaterials.find(rm => rm.id === (record?.product_id || machine.last_product_id));
        const avg = weeklyMoldAvg[mold?.id ?? -1] ?? moldStats[mold?.id ?? -1];
        const weekKg = weeklyMachineKg[machine.id] ?? 0;

        return (
          <div key={machine.id} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-slate-700/50 transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${statusColors[machine.status] || 'bg-[#ecfdf5]0'}`} title={statusLabels[machine.status]} />
                <h3 className="font-bold text-lg">{machine.name}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenSingleModal(machine); }}
                  className="mr-2 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-sm font-bold transition"
                  title="إضافة إنتاج"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-[#ecfdf5]0 bg-slate-700/50 px-2 py-0.5 rounded-full">
                {statusLabels[machine.status] || machine.status}
              </span>
            </div>

            <div className="text-sm text-slate-400 space-y-1 mb-3">
              <p><span className="text-[#ecfdf5]0">الإسطمبة:</span> {mold?.name || '---'}</p>
              <p><span className="text-[#ecfdf5]0">الخامة:</span> {rawMat?.product?.name || '---'}</p>
            </div>

            {record ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-bold text-lg">{Number(record.total_production_kg).toFixed(1)} كجم</span>
                  <span className="text-emerald-400 font-bold">{record.pieces_produced} ق</span>
                </div>
                {avg > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-[#ecfdf5]0 mb-1">
                      <span>الأداء</span>
                      <span className={Number(record.total_production_kg) >= avg ? 'text-green-400' : 'text-red-400'}>
                        {((Number(record.total_production_kg) / avg) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${Number(record.total_production_kg) >= avg ? 'bg-gradient-to-l from-green-500 to-emerald-400' : 'bg-gradient-to-l from-red-500 to-rose-400'}`}
                        style={{ width: `${Math.min(100, (Number(record.total_production_kg) / avg) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {weekKg > 0 && (
                  <p className="text-[11px] text-[#ecfdf5]0">آخر 30 يوم: <span className="text-slate-300 font-medium">{weekKg.toFixed(1)} كجم</span></p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-slate-600 text-sm mb-2">لا يوجد إنتاج اليوم</p>
                {weekKg > 0 && (
                  <p className="text-[11px] text-[#ecfdf5]0">آخر 30 يوم: <span className="text-slate-300 font-medium">{weekKg.toFixed(1)} كجم</span></p>
                )}
                {avg > 0 && (
                  <p className="text-[11px] text-[#ecfdf5]0">متوسط الإنتاج: <span className="text-slate-300">{avg.toFixed(1)} كجم</span></p>
                )}
              </div>
            )}

            <button
              onClick={onOpenModal}
              className="mt-3 w-full text-sm bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition font-medium"
            >
              {record ? 'تعديل الإنتاج' : 'تسجيل إنتاج'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
