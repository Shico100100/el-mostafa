'use client';

import type { ProductionRecord } from '@/components/manufacturing/types';
import { Clock } from 'lucide-react';

interface WeeklyProductionTableProps {
  records: ProductionRecord[];
  weeklyMoldAvg: Record<number, number>;
  moldStats: Record<number, number>;
  onShowHistory: (recordId: number) => void;
}

export default function WeeklyProductionTable({
  records, weeklyMoldAvg, moldStats, onShowHistory,
}: WeeklyProductionTableProps) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-10 text-center">
        <p className="text-slate-500">لا توجد سجلات إنتاج في هذه الفترة</p>
      </div>
    );
  }

  const totalKg = records.reduce((s, r) => s + Number(r.total_production_kg), 0);
  const totalPieces = records.reduce((s, r) => s + Number(r.pieces_produced), 0);

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-700/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">التاريخ</th>
              <th className="px-4 py-3 whitespace-nowrap">الماكينة</th>
              <th className="px-4 py-3 whitespace-nowrap">الإسطمبة</th>
              <th className="px-4 py-3 whitespace-nowrap">الخامة</th>
              <th className="px-4 py-3 whitespace-nowrap">ساعات العمل</th>
              <th className="px-4 py-3 whitespace-nowrap">الإنتاج (كجم)</th>
              <th className="px-4 py-3 whitespace-nowrap">القطع</th>
              <th className="px-4 py-3 whitespace-nowrap">الأداء</th>
              <th className="px-4 py-3 whitespace-nowrap" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((record) => {
              const moldAvg = weeklyMoldAvg[record.mold_id] ?? moldStats[record.mold_id] ?? 0;
              const isGood = moldAvg === 0 || Number(record.total_production_kg) >= moldAvg;
              return (
                <tr key={`${record.id}-${record.date}`} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">{record.date}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{record.machine?.name}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{record.mold?.name}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{record.raw_material?.product?.name}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{record.hours_worked} س</td>
                  <td className={`px-4 py-3 font-bold whitespace-nowrap ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(record.total_production_kg).toFixed(1)} كجم
                  </td>
                  <td className="px-4 py-3 text-blue-400 font-bold whitespace-nowrap">{record.pieces_produced} ق</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {moldAvg > 0 ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {((Number(record.total_production_kg) / moldAvg) * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onShowHistory(record.id)}
                      className="text-xs bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-lg transition"
                      title="عرض تاريخ التعديلات"
                    >
                      <Clock />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-700/30">
            <tr>
              <td colSpan={5} className="px-4 py-3 font-bold text-slate-300 text-left">الإجمالي</td>
              <td className="px-4 py-3 font-bold text-emerald-400">{totalKg.toFixed(1)} كجم</td>
              <td className="px-4 py-3 font-bold text-blue-400">{totalPieces.toLocaleString()} ق</td>
              <td /><td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
