'use client';

import type { RecordHistoryEntry } from '@/components/manufacturing/types';
import { Clock, X } from 'lucide-react';

interface RecordHistoryModalProps {
  show: boolean;
  entries: RecordHistoryEntry[];
  recordId: number | null;
  onClose: () => void;
}

export default function RecordHistoryModal({ show, entries, recordId, onClose }: RecordHistoryModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><Clock /> تاريخ التعديلات — سجل #{recordId}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {entries.length === 0 ? (
            <p className="text-center text-[#ecfdf5]0 py-12">لا يوجد تاريخ تعديلات لهذا السجل</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        entry.change_type === 'UPDATE' ? 'bg-amber-500/20 text-amber-400' :
                        entry.change_type === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {entry.change_type === 'UPDATE' ? 'تعديل' :
                         entry.change_type === 'DELETE' ? 'حذف' : 'إنشاء'}
                      </span>
                    </div>
                    <span className="text-sm text-[#ecfdf5]0">
                      {new Date(entry.changed_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  {entry.change_type === 'UPDATE' && entry.old_values && entry.new_values && (
                    <div className="text-sm space-y-1">
                      {Object.keys(entry.old_values)
                        .filter(k => entry.old_values![k] !== entry.new_values![k])
                        .map(key => (
                          <div key={key} className="grid grid-cols-3 gap-2 text-slate-400">
                            <span className="text-[#ecfdf5]0">{({
                              total_production_kg: 'الإنتاج', hours_worked: 'ساعات',
                              pieces_produced: 'القطع', notes: 'ملاحظات', status: 'الحالة',
                              machine_id: 'الماكينة', mold_id: 'الإسطمبة',
                              product_id: 'الخامة', date: 'التاريخ',
                            }[key] || key)}</span>
                            <span className="text-red-400 line-through">{String(entry.old_values![key] ?? '—')}</span>
                            <span className="text-green-400">{String(entry.new_values![key] ?? '—')}</span>
                          </div>
                        ))}
                    </div>
                  )}
                  {entry.change_type === 'DELETE' && entry.old_values && (
                    <div className="text-sm text-red-400">
                      تم حذف السجل — كان الإنتاج: {Number(entry.old_values.total_production_kg).toFixed(1)} كجم
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
