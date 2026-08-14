'use client';

import type { AnalyticsData } from '../types';
import { ReportBarChart, ReportPieChart } from '../ReportCharts';

export function AnalyticsTab({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ReportBarChart
          title="قيمة المخزون حسب التصنيف"
          data={(analytics.inventory || []).map(d => ({ name: d.name, value: d.value }))}
          color="#3b82f6"
        />
        <ReportPieChart
          title="توزيع المبيعات حسب القسم"
          data={(analytics.sales || []).map(d => ({ name: d.name, value: d.value }))}
        />
      </div>
    </div>
  );
}
