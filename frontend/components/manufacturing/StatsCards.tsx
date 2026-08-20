'use client';

interface StatsCardsProps {
  todayTotalKg: number;
  todayTotalPieces: number;
  activeMachinesCount: number;
  totalMachines: number;
  machinesInProduction: number;
  avgPerMachine: number;
}

export default function StatsCards({
  todayTotalKg, todayTotalPieces, activeMachinesCount,
  totalMachines, machinesInProduction, avgPerMachine,
}: StatsCardsProps) {
  const cards = [
    { label: 'إجمالي الإنتاج', value: todayTotalKg.toFixed(1), sub: 'كجم', color: 'blue' },
    { label: 'إجمالي القطع', value: todayTotalPieces.toLocaleString(), sub: 'قطعة', color: 'emerald' },
    { label: 'الماكينات النشطة', value: `${activeMachinesCount}`, sub: `/ ${totalMachines} ماكينة`, color: 'purple' },
    { label: 'مشغولة اليوم', value: machinesInProduction.toString(), sub: 'ماكينة', color: 'amber' },
    { label: 'متوسط / ماكينة', value: avgPerMachine.toFixed(1), sub: 'كجم', color: 'indigo' },
  ];

  const colors: Record<string, string> = {
    blue: 'from-emerald-500/10 to-blue-600/10 border-emerald-500/20 text-blue-400',
    emerald: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    purple: 'from-teal-500/10 to-purple-600/10 border-teal-500/20 text-purple-400',
    amber: 'from-amber-500/10 to-amber-600/10 border-amber-500/20 text-amber-400',
    indigo: 'from-teal-500/10 to-indigo-600/10 border-teal-500/20 text-indigo-400',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`bg-gradient-to-br ${colors[card.color]} border rounded-2xl p-4 md:p-5`}>
          <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">{card.label}</p>
          <p className={`text-xl md:text-2xl font-bold ${colors[card.color].split(' ').pop()}`}>{card.value}</p>
          <p className="text-xs text-[#ecfdf5]0">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
