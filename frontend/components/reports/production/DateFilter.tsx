'use client';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onLoad: () => void;
}

export function DateFilter({ startDate, endDate, loading, onStartDateChange, onEndDateChange, onLoad }: DateFilterProps) {
  return (
    <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end flex-wrap">
      <div>
        <label className="block text-sm text-gray-400 mb-1">من تاريخ</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">إلى تاريخ</label>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white" />
      </div>
      <button onClick={onLoad} disabled={loading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50">
        {loading ? 'جاري التحميل...' : 'تحديث'}
      </button>
    </div>
  );
}
