'use client';

import { ArrowRight, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccessories } from '@/hooks/assembly/useAccessories';
import { StatsCard } from '@/components/assembly/accessories/StatsCard';
import { AccessoriesToolbar } from '@/components/assembly/accessories/AccessoriesToolbar';
import { AccessoriesTable } from '@/components/assembly/accessories/AccessoriesTable';
import { AddEditAccessoryModal } from '@/components/assembly/accessories/modals/AddEditAccessoryModal';
import { StockOperationModal } from '@/components/assembly/accessories/modals/StockOperationModal';
import { HistoryModal } from '@/components/assembly/accessories/modals/HistoryModal';
import { ReportsModal } from '@/components/assembly/accessories/modals/ReportsModal';
import { PODraftModal } from '@/components/assembly/accessories/modals/PODraftModal';
import { BulkStockModal } from '@/components/assembly/accessories/modals/BulkStockModal';

export default function AccessoriesPage() {
  const router = useRouter();
  const {
    accessories, loading, totalValue,
    showAddDialog, setShowAddDialog,
    showStockDialog, setShowStockDialog,
    showConsumeDialog, setShowConsumeDialog,
    showHistoryDialog, setShowHistoryDialog,
    showReportsDialog, setShowReportsDialog,
    showBulkDialog, setShowBulkDialog,
    showPODialog, setShowPODialog,
    selectedAccessory,
    history, formData, setFormData,
    stockMode, setStockMode,
    setSelectedFile,
    reportType, reportData, poData, bulkItems, setBulkItems,

    handleSave, handleStockOperation,
    handleHistory, handleReports,
    handleDraftPO, handleBulkSubmit, loadData,
    openStockDialog, openEditDialog, openAddDialog,
    handleDelete, getStatusColor,
  } = useAccessories();

  if (loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white transition"><ArrowRight className="w-5 h-5" /></button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6" /> إدارة الأكسسوارات</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <StatsCard totalValue={totalValue} />
        <AccessoriesToolbar
          onOpenReports={() => { handleReports('TOP'); setShowReportsDialog(true); }}
          onDraftPO={handleDraftPO}
          onOpenBulk={() => setShowBulkDialog(true)}
          onAdd={openAddDialog}
          onImportSuccess={loadData}
        />
        <AccessoriesTable
          accessories={accessories}
          getStatusColor={getStatusColor}
          onStockAdd={(acc) => openStockDialog(acc, 'add')}
          onStockConsume={(acc) => openStockDialog(acc, 'consume')}
          onEdit={openEditDialog}
          onHistory={handleHistory}
          onDelete={handleDelete}
        />
      </main>

      <AddEditAccessoryModal
        show={showAddDialog}
        isEdit={!!selectedAccessory}
        formData={formData} setFormData={setFormData}
        setSelectedFile={setSelectedFile}
        onSubmit={handleSave}
        onClose={() => setShowAddDialog(false)}
      />

      <StockOperationModal
        show={showStockDialog || showConsumeDialog}
        isAdd={showStockDialog}
        accessory={selectedAccessory}
        formData={formData} setFormData={setFormData}
        stockMode={stockMode} setStockMode={setStockMode}
        onSubmit={(e) => handleStockOperation(showStockDialog ? 'add' : 'consume', e)}
        onClose={() => { setShowStockDialog(false); setShowConsumeDialog(false); }}
      />

      <HistoryModal
        show={showHistoryDialog}
        accessory={selectedAccessory}
        history={history}
        onClose={() => setShowHistoryDialog(false)}
      />

      <ReportsModal
        show={showReportsDialog}
        reportType={reportType}
        reportData={reportData}
        onReportTypeChange={handleReports}
        onClose={() => setShowReportsDialog(false)}
      />

      <PODraftModal
        show={showPODialog}
        poData={poData}
        onClose={() => setShowPODialog(false)}
      />

      <BulkStockModal
        show={showBulkDialog}
        accessories={accessories}
        bulkItems={bulkItems} setBulkItems={setBulkItems}
        onSubmit={handleBulkSubmit}
        onClose={() => setShowBulkDialog(false)}
      />
    </div>
  );
}
