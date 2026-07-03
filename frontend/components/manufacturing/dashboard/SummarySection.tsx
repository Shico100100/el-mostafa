'use client';

interface ManufacturingStats {
  activeMachines: number;
  dailyProductionOrders: number;
  usedMoldsCount: number;
}

interface SummarySectionProps {
  stats: ManufacturingStats;
  loading: boolean;
}

export function SummarySection({ stats, loading }: SummarySectionProps) {
  const items = [
    { label: 'الماكينات النشطة (المسجلة)', value: stats.activeMachines, color: 'text-green-400' },
    { label: 'عدد سجلات الإنتاج (اليوم)', value: stats.dailyProductionOrders, color: 'text-blue-400' },
    { label: 'الإسطمبات المستخدمة (اليوم)', value: stats.usedMoldsCount, color: 'text-purple-400' },
  ];
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">نشاط التصنيع اليوم</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center text-gray-300 border-b border-white/10 pb-2">
            <span>{item.label}</span>
            <span className={`font-bold ${item.color}`}>{loading ? '...' : item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
