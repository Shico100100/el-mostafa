'use client';

interface MonthFilterProps {
  month: string;
  onMonthChange: (m: string) => void;
}

export function MonthFilter({ month, onMonthChange }: MonthFilterProps) {
  return (
    <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end">
      <div className="flex-1 max-w-xs">
        <label className="block text-sm text-gray-400 mb-1">الشهر</label>
        <input type="month" value={month} onChange={e => onMonthChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white" />
      </div>
    </div>
  );
}
