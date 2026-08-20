'use client';

import type { RangeSession } from '@/components/manufacturing/types';
import { FileText, Calendar, Scale, X } from 'lucide-react';

interface SessionsModalProps {
  show: boolean;
  sessions: RangeSession[];
  sessionsTotal: number;
  sessionsPage: number;
  sessionsLoading: boolean;
  onClose: () => void;
  onSessionClick: (session: RangeSession) => void;
  onPageChange: (page: number) => void;
}

export default function SessionsModal({
  show, sessions, sessionsTotal, sessionsPage, sessionsLoading,
  onClose, onSessionClick, onPageChange,
}: SessionsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> سجل الفترات</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><X /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-[#ecfdf5]0 py-12">لا توجد فترات مسجلة</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-violet-500/30 transition cursor-pointer"
                  onClick={() => onSessionClick(session)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-violet-400 font-bold">#{session.id}</span>
                      <span className="text-slate-300">{session.machine?.name}</span>
                      <span className="text-[#ecfdf5]0 text-sm">{session.mold?.name}</span>
                    </div>
                    <span className="text-sm text-[#ecfdf5]0">
                      {session.created_at ? new Date(session.created_at).toLocaleDateString('ar-EG') : ''}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Calendar /> {session.start_date} → {session.end_date}</span>
                    <span className="flex items-center gap-1"><Scale /> {Number(session.total_production_kg).toFixed(1)} كجم</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${session.mode === 'distribute' ? 'bg-emerald-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {session.mode === 'distribute' ? 'توزيع' : 'دفعة واحدة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {sessionsTotal > 20 && (
          <div className="p-4 border-t border-slate-700 flex justify-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, sessionsPage - 1))}
              disabled={sessionsPage <= 1}
              className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50"
            >
              السابق
            </button>
            <span className="px-4 py-2 text-slate-400">صفحة {sessionsPage}</span>
            <button
              onClick={() => onPageChange(sessionsPage + 1)}
              disabled={sessionsPage * 20 >= sessionsTotal}
              className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
