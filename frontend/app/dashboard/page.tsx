'use client';

import { DateProvider } from '@/lib/dashboard/date-context';
import { DashboardProvider } from '@/lib/dashboard/dashboard-context';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DateProvider>
        <DashboardProvider>
          <DashboardPageContent />
        </DashboardProvider>
      </DateProvider>
    </ErrorBoundary>
  );
}
