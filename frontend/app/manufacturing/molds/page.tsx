'use client';

import { useMolds } from '@/hooks/manufacturing/useMolds';
import { MoldsHeader } from '@/components/manufacturing/molds/MoldsHeader';
import { MoldFilters } from '@/components/manufacturing/molds/MoldFilters';
import { MoldCard } from '@/components/manufacturing/molds/MoldCard';
import { AddEditMoldDialog } from '@/components/manufacturing/molds/AddEditMoldDialog';
import { IssueMoldDialog } from '@/components/manufacturing/molds/IssueMoldDialog';

export default function MoldsPage() {
  const h = useMolds();

  if (h.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <MoldsHeader onImportSuccess={h.loadData} />
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <button onClick={() => { h.setEditingMold(null); h.setShowModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
            + إضافة إسطمبة جديدة
          </button>
          <MoldFilters searchQuery={h.searchQuery} statusFilter={h.statusFilter} productFilter={h.productFilter}
            products={h.products} onSearchChange={h.setSearchQuery} onStatusChange={h.setStatusFilter}
            onProductChange={h.setProductFilter} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {h.filteredMolds.map(mold => (
            <MoldCard key={mold.id} mold={mold}
              onEdit={(m) => { h.setEditingMold(m); h.setShowModal(true); }}
              onIssue={(m) => { h.setSelectedMoldForIssue(m); h.setShowIssueModal(true); }} />
          ))}
          {h.molds.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-12">لا توجد إسطمبات. قم بإضافة إسطمبة جديدة.</div>
          )}
        </div>
      </main>
      <AddEditMoldDialog visible={h.showModal} editingMold={h.editingMold} products={h.products}
        onSave={h.handleSave} onClose={() => { h.setShowModal(false); h.setEditingMold(null); }} />
      <IssueMoldDialog visible={h.showIssueModal} moldName={h.selectedMoldForIssue?.name || ''}
        onSave={h.handleSaveIssue} onClose={() => { h.setShowIssueModal(false); h.setSelectedMoldForIssue(null); }} />
    </div>
  );
}
