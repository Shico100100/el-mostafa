'use client';

import { useAccounting } from '@/hooks/accounting/useAccounting';
import { AccountingHeader } from '@/components/accounting/AccountingHeader';
import { ChartsSection } from '@/components/accounting/ChartsSection';
import { AccountsTable } from '@/components/accounting/AccountsTable';
import { TrialBalanceSummary } from '@/components/accounting/TrialBalanceSummary';
import { AddAccountModal } from '@/components/accounting/AddAccountModal';

export default function AccountingPage() {
  const h = useAccounting();

  if (h.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <AccountingHeader />

      <main className="container mx-auto px-6 py-8">
        <ChartsSection accountTypeCounts={h.accountTypeCounts} topTrialBalance={h.topTrialBalance} />

        <div className="mb-6">
          <button
            onClick={() => h.setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition"
          >
            + إضافة حساب جديد
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AccountsTable accounts={h.accounts} />
          <TrialBalanceSummary totals={h.totalsByType} />
        </div>
      </main>

      <AddAccountModal
        show={h.showModal}
        code={h.code}
        name={h.name}
        type={h.type}
        description={h.description}
        onClose={() => h.setShowModal(false)}
        onCodeChange={h.setCode}
        onNameChange={h.setName}
        onTypeChange={h.setType}
        onDescriptionChange={h.setDescription}
        onSubmit={h.handleSubmit}
      />
    </div>
  );
}
