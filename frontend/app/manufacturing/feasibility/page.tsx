'use client';

import { useRouter } from 'next/navigation';
import { useFeasibility } from '@/hooks/manufacturing/useFeasibility';
import { FeasibilityHeader } from '@/components/manufacturing/feasibility/FeasibilityHeader';
import { FeasibilityInputForm } from '@/components/manufacturing/feasibility/FeasibilityInputForm';
import { OverallStatus } from '@/components/manufacturing/feasibility/OverallStatus';
import { SummaryCards } from '@/components/manufacturing/feasibility/SummaryCards';
import { ProductAnalysisTable } from '@/components/manufacturing/feasibility/ProductAnalysisTable';
import { ComponentRequirementsTable } from '@/components/manufacturing/feasibility/ComponentRequirementsTable';
import { PlasticMaterialsTable } from '@/components/manufacturing/feasibility/PlasticMaterialsTable';
import { ProductionHistoryModal } from '@/components/manufacturing/feasibility/ProductionHistoryModal';

export default function ProductionFeasibilityPage() {
  const router = useRouter();
  const f = useFeasibility();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <FeasibilityHeader onBack={() => router.push('/manufacturing')} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <FeasibilityInputForm
          productOptions={f.productOptions}
          productionItems={f.productionItems}
          onAddItem={f.addItem}
          onRemoveItem={f.removeItem}
          onUpdateItem={f.updateItem}
          onAnalyze={f.analyze}
          onClear={f.clearAll}
          onSave={f.saveReport}
          loading={f.loading}
          saving={f.saving}
          hasReport={!!f.report}
        />

        {f.report && (
          <>
            <OverallStatus report={f.report} />
            <SummaryCards report={f.report} />
            <ProductAnalysisTable items={f.report.items} />
            <ComponentRequirementsTable components={f.report.components} />
            <PlasticMaterialsTable suggestions={f.report.plasticMaterialSuggestions} onShowHistory={f.showHistory} />
          </>
        )}
      </main>

      {f.historyModal.visible && f.historyModal.data && (
        <ProductionHistoryModal
          productName={f.historyModal.productName}
          data={f.historyModal.data}
          onClose={() => f.setHistoryModal({ ...f.historyModal, visible: false })}
        />
      )}
    </div>
  );
}
