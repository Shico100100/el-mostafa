'use client';

import { DateProvider } from '@/lib/dashboard/date-context';
import { DashboardProvider } from '@/lib/dashboard/dashboard-context';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';

export default function DashboardPage() {
  return (
    <DateProvider>
      <DashboardProvider>
        <DashboardPageContent />
      </DashboardProvider>
    </DateProvider>
  );
}
