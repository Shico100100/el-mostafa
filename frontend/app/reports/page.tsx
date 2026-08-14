'use client';

import { BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReports } from '@/hooks/reports/useReports';
import { ReportTabs } from '@/components/reports/ReportTabs';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { SalesReportTab } from '@/components/reports/tabs/SalesReportTab';
import { PurchasesReportTab } from '@/components/reports/tabs/PurchasesReportTab';
import { StockReportTab } from '@/components/reports/tabs/StockReportTab';
import { ProfitLossTab } from '@/components/reports/tabs/ProfitLossTab';
import { AnalyticsTab } from '@/components/reports/tabs/AnalyticsTab';
import { ShipmentProfitTab } from '@/components/reports/tabs/ShipmentProfitTab';

export default function ReportsPage() {
  const router = useRouter();
  const {
    activeTab, setActiveTab, loading, startDate, setStartDate, endDate, setEndDate,
    data, analytics, shipmentProfit, loadReport, exportToExcel,
    page, setPage,
  } = useReports();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6" /> التقارير وتحليلات المبيعات</h1>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">
            العودة للرئيسية
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ReportFilters
          activeTab={activeTab} startDate={startDate} endDate={endDate}
          onStartDateChange={setStartDate} onEndDateChange={setEndDate}
          onRefresh={loadReport} onExport={exportToExcel}
        />

        {loading ? (
          <div className="text-center text-white py-12">جاري التحميل...</div>
        ) : data ? (
          <div className="space-y-6">
            {activeTab === 'SALES' && <SalesReportTab data={data} page={data?.page || page} totalPages={data?.totalPages || 1} onPageChange={setPage} />}
            {activeTab === 'PURCHASES' && <PurchasesReportTab data={data} page={data?.page || page} totalPages={data?.totalPages || 1} onPageChange={setPage} />}
            {activeTab === 'STOCK' && <StockReportTab data={data} />}
            {activeTab === 'PROFIT_LOSS' && <ProfitLossTab data={data} />}
          </div>
        ) : null}

        {activeTab === 'ANALYTICS' && <AnalyticsTab analytics={analytics} />}
        {activeTab === 'SHIPMENT_PROFIT' && shipmentProfit && <ShipmentProfitTab shipmentProfit={shipmentProfit} />}
      </main>
    </div>
  );
}
