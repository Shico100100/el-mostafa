'use client';

import { ArrowLeft, BarChart3, CloudDownload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/purchases/usePurchaseOrders';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import PurchaseOrderTable from '@/components/purchases/PurchaseOrderTable';
import LowStockAlert from '@/components/purchases/LowStockAlert';
import PrintTemplate from '@/components/purchases/PrintTemplate';
import PurchaseOrderModal from '@/components/purchases/modals/PurchaseOrderModal';
import PaymentModal from '@/components/purchases/modals/PaymentModal';
import QuickProductModal from '@/components/purchases/modals/QuickProductModal';
import LandedCostModal from '@/components/purchases/modals/LandedCostModal';
import PackingListModal from '@/components/purchases/modals/PackingListModal';
import { Pagination } from '@/components/Pagination';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const h = usePurchaseOrders();
  const { syncInvoices, runIncrementalSync, syncing } = usePeachtreeSync();

  return (
    <>
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">أوامر الشراء</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-1">بحث (المورد أو رقم الفاتورة)</label>
              <input
                type="text"
                placeholder="بحث..."
                value={h.filters.search}
                onChange={(e) => h.setFilters({ ...h.filters, search: e.target.value, page: 1 })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">من تاريخ</label>
              <input
                type="date"
                value={h.filters.fromDate}
                onChange={(e) => h.setFilters({ ...h.filters, fromDate: e.target.value, page: 1 })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={h.filters.toDate}
                onChange={(e) => h.setFilters({ ...h.filters, toDate: e.target.value, page: 1 })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={h.exportToExcel}
              className="px-6 py-2 h-[42px] bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 inline" /> تصدير Excel
            </button>
            <button
              onClick={() => syncInvoices(['purchase_invoices', 'invoice_line_items']).finally(h.loadData)}
              disabled={syncing}
              className="px-6 py-2 h-[42px] bg-white/10 hover:bg-white/20 text-teal-300 rounded-lg border border-teal-500/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudDownload className="w-4 h-4" />
              {syncing ? 'جارٍ الاستيراد...' : 'استيراد من Peachtree'}
            </button>
            <button
              onClick={() => runIncrementalSync().finally(h.loadData)}
              disabled={syncing}
              className="px-6 py-2 h-[42px] bg-white/10 hover:bg-white/20 text-emerald-300 rounded-lg border border-emerald-500/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="تحديث الفواتير الجديدة فقط دون تكرار المستوردة مسبقاً"
            >
              <CloudDownload className="w-4 h-4" />
              {syncing ? 'جارٍ التحديث...' : 'تحديث من Peachtree'}
            </button>
            <button
              onClick={() => {
                h.resetForm();
                h.setShowModal(true);
              }}
              className="px-6 py-2 h-[42px] bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition"
            >
              + أمر شراء جديد
            </button>
          </div>
        </div>

        <LowStockAlert
          products={h.lowStockProducts}
          visible={h.showLowStockAlert}
          onDismiss={() => h.setShowLowStockAlert(false)}
        />

        <PurchaseOrderTable
          orders={h.orders}
          suppliers={h.suppliers}
          loading={h.loading}
          onEdit={h.handleEditOrder}
          onDelete={h.handleDeleteOrder}
          onPayment={h.openPaymentModal}
          onPrint={h.preparePrint}
          onLandedCost={h.openLandedCost}
          onPackingList={h.openPackingList}
        />
        <Pagination
          page={h.filters.page}
          totalPages={h.totalPages}
          totalItems={h.totalItems}
          showingItems={h.orders.length}
          onPageChange={(p) => h.setFilters({ ...h.filters, page: p })}
        />
      </main>

      <PurchaseOrderModal
        show={h.showModal}
        editingOrder={!!h.editingOrder}
        newOrder={h.newOrder}
        suppliers={h.suppliers}
        products={h.products}
        typingValues={h.typingValues}
        onClose={() => { h.setShowModal(false); h.setEditingOrder(null); }}
        onSubmit={h.handleSubmit}
        onNewOrderChange={h.setNewOrder}
        onAddItem={h.handleAddItem}
        onRemoveItem={h.handleRemoveItem}
        onItemChange={h.handleItemChange}
        onItemTotalChange={h.handleItemTotalChange}
        onTypedChange={h.handleTypedChange}
        onExportItems={h.handleExportItems}
        onImportItems={h.handleImportItems}
        onQuickProduct={(index) => {
          h.setActiveItemIndex(index);
          h.setShowQuickProductModal(true);
        }}
        calculateTotal={h.calculateTotal}
        fileInputRef={h.fileInputRef}
      />

      <PaymentModal
        show={h.showPaymentModal}
        order={h.selectedOrderForPayment}
        paymentData={h.paymentData}
        onClose={() => { h.setShowPaymentModal(false); h.setSelectedOrderForPayment(null); }}
        onSubmit={h.handlePaymentSubmit}
        onPaymentDataChange={h.setPaymentData}
      />

      <QuickProductModal
        show={h.showQuickProductModal}
        data={h.quickProductData}
        onClose={() => { h.setShowQuickProductModal(false); h.setActiveItemIndex(null); }}
        onSubmit={h.handleQuickProductSubmit}
        onDataChange={h.setQuickProductData}
      />

      <LandedCostModal
        show={h.showLandedCostModal}
        form={h.landedCostForm}
        data={h.landedCostData}
        calculating={h.calculatingLandedCost}
        onClose={() => h.setShowLandedCostModal(false)}
        onFormChange={h.setLandedCostForm}
        onCalculate={h.handleUpdateLandedCost}
      />

      <PackingListModal
        show={h.showPackingListModal}
        form={h.packingListForm}
        result={h.packingListResult}
        saving={h.savingPackingList}
        onClose={() => h.setShowPackingListModal(false)}
        onFormChange={h.setPackingListForm}
        onSave={h.handleSavePackingList}
      />

      <PrintTemplate order={h.orderToPrint} componentRef={h.componentRef} />
    </>
  );
}
