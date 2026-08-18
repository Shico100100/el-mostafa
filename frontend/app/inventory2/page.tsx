'use client';

import { useInventory2Dashboard } from '@/hooks/inventory2/useInventory2Dashboard';
import { Inventory2Header } from '@/components/inventory2/dashboard/Inventory2Header';
import { HeroStatsGrid, useHeroStats } from '@/components/inventory2/dashboard/HeroStatsGrid';
import { TypeDistributionBars } from '@/components/inventory2/dashboard/TypeDistributionBars';
import { StockHealthDonut } from '@/components/inventory2/dashboard/StockHealthDonut';
import { RecentMovements } from '@/components/inventory2/dashboard/RecentMovements';
import { SemiFinishedSummary } from '@/components/inventory2/dashboard/SemiFinishedSummary';
import { AlertsPanel } from '@/components/inventory2/dashboard/AlertsPanel';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function Inventory2Dashboard() {
  const h = useInventory2Dashboard();
  const heroStats = useHeroStats(h.totalProducts, h.totalStockAll, h.sfTotalStock, h.sfTotalValue, h.lowStockCount, h.outOfStockCount);

  if (h.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-400 text-lg">جاري تحميل لوحة التحكم...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <Inventory2Header totalProducts={h.totalProducts} semiFinishedCount={h.semiFinished.length} totalStockAll={h.totalStockAll} />
        <div className="px-8 py-8 space-y-8">
          <HeroStatsGrid stats={heroStats} />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <TypeDistributionBars typeStats={h.typeStats} totalProducts={h.totalProducts} maxCount={h.maxCount} />
            <StockHealthDonut inStock={h.inStock} lowStockCount={h.lowStockCount} outOfStockCount={h.outOfStockCount} total={h.total} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentMovements movements={h.recentMovements} />
            <div className="space-y-6">
              <SemiFinishedSummary semiFinished={h.semiFinished} sfTotalValue={h.sfTotalValue} sfTop={h.sfTop} sfMaxValue={h.sfMaxValue} />
              <AlertsPanel outOfStockCount={h.outOfStockCount} lowStockCount={h.lowStockCount} />
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
}
