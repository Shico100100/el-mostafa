'use client';

import { useControlTower } from '@/hooks/dashboard/useControlTower';
import { MetricCard } from '@/components/dashboard/control-tower/MetricCard';
import { TrendChart } from '@/components/dashboard/control-tower/TrendChart';
import { ProductionBarChart } from '@/components/dashboard/control-tower/ProductionBarChart';
import { InventoryPieChart } from '@/components/dashboard/control-tower/InventoryPieChart';
import { SummaryPanel } from '@/components/dashboard/control-tower/SummaryPanel';
import { DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ControlTower() {
  const { trends, inventoryValue, stats, loading } = useControlTower();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 pt-24" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              برج المراقبة (Control Tower)
            </h1>
            <p className="text-slate-400 mt-2 font-medium">نظرة شاملة ومؤشرات الأداء الرئيسية للمصنع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <MetricCard title="قيمة المخزون" value={stats?.totalValue || 0} unit="ج.م" icon={<DollarSign />} color="blue" />
          <MetricCard title="إجمالي الأصناف" value={stats?.productCount || 0} unit="صنف" icon={<Package />} color="indigo" />
          <MetricCard title="عجز في خطة الإنتاج" value={stats?.lowStockItems?.length || 0} unit="صنف" icon={<AlertTriangle />} color="rose" />
          <MetricCard title="معدل النمو الشهري" value="+12%" unit="مبيعات" icon={<TrendingUp />} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TrendChart data={trends} />
          <ProductionBarChart data={trends} />
          <InventoryPieChart data={inventoryValue} />
          <SummaryPanel trends={trends} stats={stats} />
        </div>
      </div>
    </div>
  );
}
