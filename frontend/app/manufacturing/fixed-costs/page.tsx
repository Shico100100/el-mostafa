'use client';

import { useFixedCosts } from '@/hooks/manufacturing/useFixedCosts';
import { FixedCostsHeader } from '@/components/manufacturing/fixed-costs/FixedCostsHeader';
import { SummaryCard } from '@/components/manufacturing/fixed-costs/SummaryCard';
import { CostsTable } from '@/components/manufacturing/fixed-costs/CostsTable';
import { AddCostDialog } from '@/components/manufacturing/fixed-costs/AddCostDialog';

export default function FixedCostsPage() {
  const h = useFixedCosts();

  if (h.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d] flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <FixedCostsHeader />

      <main className="container mx-auto px-6 py-8">
        <SummaryCard totalAmount={h.totalAmount} currentYear={h.currentYear} onYearChange={h.setCurrentYear} />

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">سجل المصروفات السنوي</h3>
          <button onClick={() => h.setShowAddDialog(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center gap-2">
            + إضافة مصروف
          </button>
        </div>

        <CostsTable costs={h.costs} onDelete={h.handleDelete} />
      </main>

      <AddCostDialog
        show={h.showAddDialog}
        month={h.formData.month}
        category={h.formData.category}
        amount={h.formData.amount}
        notes={h.formData.notes}
        onFormChange={h.setFormData}
        onSubmit={h.handleSubmit}
        onClose={h.closeDialog}
      />
    </div>
  );
}
