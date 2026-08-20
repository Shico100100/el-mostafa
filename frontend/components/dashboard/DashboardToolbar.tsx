'use client';

import { useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useDate } from '@/lib/dashboard/date-context';
import { useDashboard } from '@/lib/dashboard/dashboard-context';

export function DashboardToolbar() {
  const { selectedDate, setSelectedDate, triggerRefresh } = useDate();
  const { setIsCustomizing, config } = useDashboard();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Dashboard Report',
  });

  const onPrint = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl border border-white/5 mb-6">
      <button
        onClick={triggerRefresh}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-blue-200 rounded-xl text-sm font-medium transition border border-emerald-500/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        تحديث
      </button>

      <button
        onClick={() => setIsCustomizing(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-sm font-medium transition border border-white/10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        تخصيص
      </button>

      <button
        onClick={onPrint}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-sm font-medium transition border border-white/10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        طباعة
      </button>

      <div className="flex items-center gap-2 mr-auto">
        <label className="text-slate-400 text-sm font-medium">التاريخ:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
        />
      </div>

      <div className="text-xs text-[#ecfdf5]0 bg-white/5 px-3 py-1.5 rounded-lg">
        {config.panels.filter((p) => p.visible).length} مربع ظاهر
      </div>

      <div ref={printRef} className="hidden" />
    </div>
  );
}
