'use client';

import { useRouter } from 'next/navigation';
import { useContainers } from '@/hooks/purchases/useContainers';
import { ContainersHeader } from '@/components/purchases/containers/ContainersHeader';
import { ContainersTable } from '@/components/purchases/containers/ContainersTable';
import { CbmCalculator } from '@/components/purchases/containers/CbmCalculator';
import { ReorderSuggestions } from '@/components/purchases/containers/ReorderSuggestions';
import { AddEditContainerDialog } from '@/components/purchases/containers/AddEditContainerDialog';

export default function ContainersPage() {
  const router = useRouter();
  const h = useContainers();

  if (h.loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <ContainersHeader onBack={() => router.push('/purchases')} onAdd={() => { h.resetForm(); h.setShowAddDialog(true); }} />
      <main className="container mx-auto px-6 py-8 space-y-8">
        <ContainersTable containers={h.containers} onEdit={h.openEdit} onDelete={h.handleDelete} />
        <CbmCalculator
          cbmLength={h.cbmLength} cbmWidth={h.cbmWidth} cbmHeight={h.cbmHeight} cbmCartons={h.cbmCartons}
          cbmResult={h.cbmResult} cbmCalculating={h.cbmCalculating}
          onLengthChange={h.setCbmLength} onWidthChange={h.setCbmWidth} onHeightChange={h.setCbmHeight}
          onCartonsChange={h.setCbmCartons} onCalculate={h.handleCalculateCBM}
        />
        <ReorderSuggestions
          containers={h.containers} reorderContainerId={h.reorderContainerId}
          reorderResults={h.reorderResults} reorderLoading={h.reorderLoading}
          onContainerChange={h.setReorderContainerId} onCalculate={h.handleReorderSuggestions}
        />
      </main>
      <AddEditContainerDialog visible={h.showAddDialog} isEdit={false} form={h.form} onFormChange={h.setForm} onSave={() => h.handleSave(false)} onClose={() => h.setShowAddDialog(false)} />
      <AddEditContainerDialog visible={h.showEditDialog} isEdit={true} form={h.form} onFormChange={h.setForm} onSave={() => h.handleSave(true)} onClose={() => h.setShowEditDialog(false)} />
    </div>
  );
}
