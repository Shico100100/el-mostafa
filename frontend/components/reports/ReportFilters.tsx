'use client';

import { BarChart3 } from 'lucide-react';
import type { TabId } from './types';

export function ReportFilters({
  activeTab, startDate, endDate, onStartDateChange, onEndDateChange, onRefresh, onExport,
}: {
  activeTab: TabId;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  if (activeTab === 'STOCK') return null;

  return (
    <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end">
      <div>
        <label className="block text-sm text-gray-400 mb-1">من تاريخ</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">إلى تاريخ</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
        />
      </div>
      <button onClick={onRefresh} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
        تحديث
      </button>
      <button onClick={onExport} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2">
        <BarChart3 className="w-4 h-4 inline" /> تصدير Excel
      </button>
    </div>
  );
}
