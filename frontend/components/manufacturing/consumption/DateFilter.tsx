'use client';

import { Search } from 'lucide-react';

interface Props {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onSearch: () => void;
}

export function DateFilter({ startDate, endDate, onStartChange, onEndChange, onSearch }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Search /> تصفية النتائج</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2">من تاريخ</label>
          <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2">إلى تاريخ</label>
          <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-end">
          <button onClick={onSearch}
            className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition">
            بحث
          </button>
        </div>
      </div>
    </div>
  );
}
