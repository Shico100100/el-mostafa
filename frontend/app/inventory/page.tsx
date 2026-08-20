'use client';

import { useInventoryDashboard } from '@/hooks/inventory/useInventoryDashboard';
import { InventoryHeader } from '@/components/inventory/dashboard/InventoryHeader';
import { HeroStatsGrid, useHeroStats } from '@/components/inventory/dashboard/HeroStatsGrid';
import { TypeDistributionBars } from '@/components/inventory/dashboard/TypeDistributionBars';
import { StockHealthDonut } from '@/components/inventory/dashboard/StockHealthDonut';
import { RecentMovements } from '@/components/inventory/dashboard/RecentMovements';
import { SemiFinishedSummary } from '@/components/inventory/dashboard/SemiFinishedSummary';
import { AlertsPanel } from '@/components/inventory/dashboard/AlertsPanel';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function InventoryDashboard() {
  const h = useInventoryDashboard();
  const heroStats = useHeroStats(h.totalProducts, h.totalStockAll, h.sfTotalStock, h.sfTotalValue, h.lowStockCount, h.outOfStockCount);

  if (h.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <div className="text-[#6b8378] text-lg">جاري تحميل لوحة التحكم...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <InventoryHeader totalProducts={h.totalProducts} semiFinishedCount={h.semiFinished.length} totalStockAll={h.totalStockAll} />
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
