'use client';

interface MovementsSummaryProps {
  inCount: number;
  outCount: number;
  adjCount: number;
}

export function MovementsSummary({ inCount, outCount, adjCount }: MovementsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 backdrop-blur rounded-2xl border border-emerald-500/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <p className="text-sm text-slate-400">وارد</p>
        </div>
        <p className="text-3xl font-black text-white mt-2">{inCount}</p>
      </div>
      <div className="bg-gradient-to-br from-red-900/30 to-red-800/10 backdrop-blur rounded-2xl border border-red-500/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <p className="text-sm text-slate-400">صادر</p>
        </div>
        <p className="text-3xl font-black text-white mt-2">{outCount}</p>
      </div>
      <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 backdrop-blur rounded-2xl border border-amber-500/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <p className="text-sm text-slate-400">تسوية</p>
        </div>
        <p className="text-3xl font-black text-white mt-2">{adjCount}</p>
      </div>
    </div>
  );
}
