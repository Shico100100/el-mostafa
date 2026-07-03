'use client';

import { useConsumption } from '@/hooks/manufacturing/useConsumption';
import { ConsumptionHeader } from '@/components/manufacturing/consumption/ConsumptionHeader';
import { StatCards } from '@/components/manufacturing/consumption/StatCards';
import { DateFilter } from '@/components/manufacturing/consumption/DateFilter';
import { ConsumptionTable } from '@/components/manufacturing/consumption/ConsumptionTable';

export default function ConsumptionHistoryPage() {
  const h = useConsumption();

  if (h.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <ConsumptionHeader />
      <main className="container mx-auto px-6 py-8">
        <StatCards stats={h.stats} />
        <DateFilter startDate={h.startDate} endDate={h.endDate}
          onStartChange={h.setStartDate} onEndChange={h.setEndDate} onSearch={h.fetchConsumptions} />
        <ConsumptionTable items={h.consumptions} />
      </main>
    </div>
  );
}
