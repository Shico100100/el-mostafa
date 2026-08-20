'use client';

interface MaintenanceStatsProps {
  overdueCount: number;
  upcomingCount: number;
  totalMachines: number;
}

export function MaintenanceStats({ overdueCount, upcomingCount, totalMachines }: MaintenanceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
        <h3 className="text-red-400 font-bold mb-2">صيانة متأخرة</h3>
        <p className="text-4xl font-black text-white">{overdueCount}</p>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl">
        <h3 className="text-amber-400 font-bold mb-2">صيانة خلال 7 أيام</h3>
        <p className="text-4xl font-black text-white">{upcomingCount}</p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
        <h3 className="text-blue-400 font-bold mb-2">إجمالي الماكينات</h3>
        <p className="text-4xl font-black text-white">{totalMachines}</p>
      </div>
    </div>
  );
}
