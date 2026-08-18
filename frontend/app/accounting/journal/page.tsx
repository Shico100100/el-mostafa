'use client';

import { useJournal } from '@/hooks/accounting/useJournal';
import { JournalHeader } from '@/components/accounting/journal/JournalHeader';
import { JournalEntriesTable } from '@/components/accounting/journal/JournalEntriesTable';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const JournalEntryModal = dynamic(
  () => import('@/components/accounting/journal/JournalEntryModal').then(m => m.JournalEntryModal),
  { ssr: false }
);

export default function JournalPage() {
  const h = useJournal();

  if (h.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <JournalHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => h.setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition"
          >
            + قيد يومية جديد
          </button>
        </div>

        <JournalEntriesTable entries={h.entries} />
      </main>

      <JournalEntryModal
        show={h.showModal}
        date={h.date}
        description={h.description}
        reference={h.reference}
        lines={h.lines}
        accounts={h.accounts}
        totalDebit={h.totalDebit}
        totalCredit={h.totalCredit}
        onClose={() => { h.setShowModal(false); h.resetForm(); }}
        onDateChange={h.setDate}
        onDescriptionChange={h.setDescription}
        onReferenceChange={h.setReference}
        onLineChange={h.handleLineChange}
        onAddLine={h.handleAddLine}
        onRemoveLine={h.handleRemoveLine}
        onSubmit={h.handleSubmit}
      />
    </div>
    </ErrorBoundary>
  );
}
