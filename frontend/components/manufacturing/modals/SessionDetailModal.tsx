'use client';

import type { SessionDetail, RangeSession, ProductionRecord } from '@/components/manufacturing/types';
import { FileText, Pencil, Trash2, Clock, X } from 'lucide-react';

interface SessionDetailModalProps {
  show: boolean;
  detail: SessionDetail | null;
  onClose: () => void;
  onEdit: (session: RangeSession) => void;
  onDelete: (sessionId: number) => void;
  onShowHistory: (recordId: number) => void;
}

export default function SessionDetailModal({
  show, detail, onClose, onEdit, onDelete, onShowHistory,
}: SessionDetailModalProps) {
  if (!show || !detail) return null;

  const { session, records } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> تفاصيل الفترة #{session.id}</h2>
            <button
              onClick={() => onEdit(session)}
              className="text-sm bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg transition flex items-center gap-1"
            >
              <Pencil /> تعديل
            </button>
            <button
              onClick={() => onDelete(session.id)}
              className="text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg transition flex items-center gap-1"
            >
              <Trash2 /> حذف
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <InfoBox label="الماكينة" value={session.machine?.name} />
            <InfoBox label="الإسطمبة" value={session.mold?.name} />
            <InfoBox label="الخامة" value={session.raw_material?.product?.name} />
            <InfoBox label="الإجمالي" value={`${Number(session.total_production_kg).toFixed(1)} كجم`} valueClass="text-emerald-400" />
            <InfoBox label="من" value={session.start_date} />
            <InfoBox label="إلى" value={session.end_date} />
            <InfoBox label="ساعات العمل" value={`${session.hours_worked} س`} />
            <InfoBox label="طريقة الحفظ" value={session.mode === 'distribute' ? 'توزيع' : 'دفعة واحدة'} />
          </div>
          {session.notes && (
            <div className="bg-slate-900/50 rounded-xl p-3 mb-6">
              <p className="text-xs text-[#ecfdf5]0 mb-1">ملاحظات</p>
              <p className="text-slate-300">{session.notes}</p>
            </div>
          )}
          <h3 className="font-bold text-lg mb-4 text-slate-300">السجلات المنشأة ({records?.length || 0})</h3>
          <table className="w-full text-right">
            <thead className="text-slate-400 text-sm">
              <tr>
                <th className="pb-3 px-2">التاريخ</th>
                <th className="pb-3 px-2">الإنتاج (كجم)</th>
                <th className="pb-3 px-2">القطع</th>
                <th className="pb-3 px-2">ساعات</th>
                <th className="pb-3 px-2">ملاحظات</th>
                <th className="pb-3 px-2" />
              </tr>
            </thead>
            <tbody>
              {records?.map((record: ProductionRecord) => (
                <tr key={record.id} className="border-t border-slate-700/50">
                  <td className="py-3 px-2 text-sm">{record.date}</td>
                  <td className="py-3 px-2 font-bold text-emerald-400">{Number(record.total_production_kg).toFixed(1)}</td>
                  <td className="py-3 px-2 text-blue-400">{record.pieces_produced}</td>
                  <td className="py-3 px-2 text-slate-400">{record.hours_worked}</td>
                  <td className="py-3 px-2 text-sm text-[#ecfdf5]0 max-w-[200px] truncate">{record.notes}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onShowHistory(record.id)}
                      className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg transition"
                      title="عرض التاريخ"
                    >
                      <Clock />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, valueClass }: { label: string; value?: string | number; valueClass?: string }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-3">
      <p className="text-xs text-[#ecfdf5]0">{label}</p>
      <p className={`font-bold ${valueClass || ''}`}>{value || '---'}</p>
    </div>
  );
}
