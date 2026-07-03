'use client';

import { useRouter } from 'next/navigation';
import { useProductionReport } from '@/hooks/reports/useProductionReport';
import { ProductionReportHeader } from '@/components/reports/production/ProductionReportHeader';
import { DateFilter } from '@/components/reports/production/DateFilter';
import { ProductionTable } from '@/components/reports/production/ProductionTable';

export default function ProductionReportPage() {
  const router = useRouter();
  const { loading, data, error, startDate, endDate, setStartDate, setEndDate, loadReport, handleDelete } = useProductionReport();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <ProductionReportHeader onBack={() => router.push('/reports')} />
      <main className="container mx-auto px-6 py-8">
        <DateFilter startDate={startDate} endDate={endDate} loading={loading}
          onStartDateChange={setStartDate} onEndDateChange={setEndDate} onLoad={loadReport} />
        {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-8 text-red-200">{error}</div>}
        {loading && <div className="text-center text-white py-12">جاري التحميل...</div>}
        {!loading && data && data.length > 0 && <ProductionTable data={data} onDelete={handleDelete} />}
        {!loading && data && data.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white/5 rounded-xl border border-white/10">
            لا توجد سجلات إنتاج في هذه الفترة
          </div>
        )}
      </main>
    </div>
  );
}
