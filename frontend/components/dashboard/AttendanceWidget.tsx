import { Users } from 'lucide-react';

export function AttendanceWidget({ summary }: { summary?: { present: number; absent: number; late: number; total: number } }) {
  if (!summary || summary.total === 0) return null;
  const { present, absent, late, total } = summary;
  const presentPct = (present / total) * 100;
  const absentPct = (absent / total) * 100;
  const latePct = (late / total) * 100;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base"><Users /></span>
        <h4 className="text-xs font-bold text-slate-300">الحضور اليوم</h4>
      </div>

      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#34d399" strokeWidth="3"
            strokeDasharray={`${presentPct} ${100 - presentPct}`}
            strokeLinecap="round" className="transition-all duration-1000" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3"
            strokeDasharray={`${absentPct} ${100 - absentPct}`}
            strokeDashoffset={-presentPct}
            strokeLinecap="round" className="transition-all duration-1000" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
            strokeDasharray={`${latePct} ${100 - latePct}`}
            strokeDashoffset={-(presentPct + absentPct)}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-white">{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-emerald-500/10 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-bold text-emerald-400">{present}</p>
          <p className="text-[9px] text-slate-500">حاضر</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-sm font-bold text-red-400">{absent}</p>
          <p className="text-[9px] text-slate-500">غائب</p>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-sm font-bold text-amber-400">{late}</p>
          <p className="text-[9px] text-slate-500">متأخر</p>
        </div>
      </div>
    </div>
  );
}
