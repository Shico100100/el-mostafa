'use client';

import { DateProvider } from '@/lib/dashboard/date-context';
import { DashboardProvider } from '@/lib/dashboard/dashboard-context';
import { DashboardPageContentV2 } from '@/components/dashboard/DashboardPageContent.v2';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DateProvider>
        <DashboardProvider>
          <DashboardPageContentV2 />
        </DashboardProvider>
      </DateProvider>
    </ErrorBoundary>
  );
}
