'use client';

import { useEffect } from 'react';
import { usePayroll } from '@/hooks/hr/usePayroll';
import { PayrollHeader } from '@/components/hr/payroll/PayrollHeader';
import { PayrollTabs } from '@/components/hr/payroll/PayrollTabs';
import { MonthFilter } from '@/components/hr/payroll/MonthFilter';
import { ProfilesTab } from '@/components/hr/payroll/ProfilesTab';
import { CalculationTab } from '@/components/hr/payroll/CalculationTab';
import { HistoryTab } from '@/components/hr/payroll/HistoryTab';
import { ProfileModal } from '@/components/hr/payroll/ProfileModal';

export default function PayrollPage() {
  const { loadProfiles, ...h } = usePayroll();

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <PayrollHeader />
      <main className="container mx-auto px-6 py-8">
        <PayrollTabs activeTab={h.activeTab} onTabChange={h.handleTabChange} />
        {h.activeTab !== 'PROFILES' && <MonthFilter month={h.month} onMonthChange={h.setMonth} />}
        {h.activeTab === 'PROFILES' && (
          <ProfilesTab profiles={h.profiles} onAdd={() => h.setShowProfileModal(true)} />
        )}
        {h.activeTab === 'CALCULATION' && (
          <CalculationTab month={h.month} results={h.calculationResults} onConfirmPayment={h.handleConfirmPayment} />
        )}
        {h.activeTab === 'HISTORY' && (
          <HistoryTab month={h.month} payments={h.payments} />
        )}
      </main>
      <ProfileModal visible={h.showProfileModal} calculationResults={h.calculationResults}
        onSave={h.handleProfileSave} onClose={() => h.setShowProfileModal(false)} />
    </div>
  );
}
