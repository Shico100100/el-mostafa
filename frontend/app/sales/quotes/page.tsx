'use client';

import { useSetBackButton } from '@/components/BackButton';
import { useQuotes } from '@/hooks/sales/useQuotes';
import { QuotesSearch } from '@/components/sales/quotes/QuotesSearch';
import { QuotesTable } from '@/components/sales/quotes/QuotesTable';
import { CreateQuoteModal } from '@/components/sales/quotes/modals/CreateQuoteModal';
import { QuoteDetailsModal } from '@/components/sales/quotes/modals/QuoteDetailsModal';

export default function SalesQuotesPage() {
  useSetBackButton('/sales/orders');
  const q = useQuotes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">عروض الأسعار</h1>
          <button onClick={() => q.setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40">
            عرض سعر جديد
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <QuotesSearch value={q.search} onChange={q.setSearch} />
        <QuotesTable
          quotes={q.filteredQuotes}
          loading={q.loading}
          onView={(quote) => { q.setSelectedQuote(quote); q.setShowDetailsModal(true); }}
          onConvert={async (id) => { await q.handleConvertToOrder(id); }}
          onDelete={(id) => q.handleDeleteQuote(id)}
        />
      </main>

      <CreateQuoteModal
        visible={q.showCreateModal}
        customers={q.customers}
        products={q.products}
        newQuote={q.newQuote}
        onClose={() => q.setShowCreateModal(false)}
        onNewQuoteChange={q.setNewQuote}
        onAddItem={q.handleAddItem}
        onRemoveItem={q.handleRemoveItem}
        onItemChange={q.handleItemChange}
        calculateTotal={q.calculateTotal}
        onSubmit={q.handleCreateQuote}
      />

      {q.showDetailsModal && q.selectedQuote && (
        <QuoteDetailsModal
          quote={q.selectedQuote}
          onClose={() => { q.setShowDetailsModal(false); q.setSelectedQuote(null); }}
          onUpdateStatus={q.handleUpdateStatus}
          onConvertToOrder={q.handleConvertToOrder}
        />
      )}
    </div>
  );
}
