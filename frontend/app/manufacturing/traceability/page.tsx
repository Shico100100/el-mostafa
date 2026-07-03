'use client';

import { useTraceability } from '@/hooks/manufacturing/useTraceability';
import { TraceabilityHeader } from '@/components/manufacturing/traceability/TraceabilityHeader';
import { TraceabilityFilters } from '@/components/manufacturing/traceability/TraceabilityFilters';
import { BatchCard } from '@/components/manufacturing/traceability/BatchCard';
import { CreateBatchModal } from '@/components/manufacturing/traceability/CreateBatchModal';

export default function TraceabilityPage() {
  const h = useTraceability();

  return (
    <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
      <TraceabilityHeader onCreateBatch={() => h.setShowCreateModal(true)} />

      <main className="container mx-auto px-6 py-8">
        <TraceabilityFilters
          filter={h.filter}
          statusFilter={h.statusFilter}
          searchBatch={h.searchBatch}
          traceResultsActive={h.traceResults !== null}
          onFilterChange={(v) => { h.setFilter(v); h.setTraceResults(null); }}
          onStatusFilterChange={h.setStatusFilter}
          onSearchBatchChange={h.setSearchBatch}
          onTrace={h.handleForwardTrace}
          onClear={() => { h.setTraceResults(null); h.setSearchBatch(''); }}
        />

        <div className="space-y-3">
          {h.loading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse">جاري التحميل...</div>
          ) : h.filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
              {h.traceResults !== null ? 'لا توجد نتائج تتبع' : 'لا توجد دفعات'}
            </div>
          ) : (
            h.filtered.map(b => <BatchCard key={b.id} batch={b} />)
          )}
        </div>
      </main>

      {h.showCreateModal && (
        <CreateBatchModal
          onClose={() => h.setShowCreateModal(false)}
          onCreated={() => { h.setShowCreateModal(false); h.loadBatches(); }}
        />
      )}
    </div>
  );
}
