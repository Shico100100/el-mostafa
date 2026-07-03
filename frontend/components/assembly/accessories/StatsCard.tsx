import { DollarSign } from 'lucide-react';

export function StatsCard({ totalValue }: { totalValue: { total_value: number; count: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm mb-1">إجمالي قيمة المخزون</p>
            <h3 className="text-3xl font-bold text-white">
              {Number(totalValue.total_value).toLocaleString()} ج.م
            </h3>
          </div>
          <div className="text-3xl"><DollarSign className="w-8 h-8 text-amber-400" /></div>
        </div>
      </div>
    </div>
  );
}
