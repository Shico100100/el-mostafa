'use client';

import { Plus, FileSpreadsheet, CloudDownload } from 'lucide-react';
import { useSetBackButton } from '@/components/BackButton';
import { useSalesOrders } from '@/hooks/sales/useSalesOrders';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SalesOrderFilters } from '@/components/sales/orders/SalesOrderFilters';
import { SalesOrdersTable } from '@/components/sales/orders/SalesOrdersTable';
import { SalesOrderPrintTemplate } from '@/components/sales/orders/SalesOrderPrintTemplate';
import { CreateSalesOrderModal } from '@/components/sales/orders/modals/CreateSalesOrderModal';
import { OrderDetailsModal } from '@/components/sales/orders/modals/OrderDetailsModal';
import { PaymentModal } from '@/components/sales/orders/modals/PaymentModal';
import { QuickCustomerModal } from '@/components/sales/orders/modals/QuickCustomerModal';

export default function SalesOrdersPage() {
  useSetBackButton('/dashboard');
  const { syncInvoices, syncing } = usePeachtreeSync();
  const {
    orders, loading, customers, products,
    filters, setFilters, totalPages, totalItems,
    showModal, setShowModal,
    showPaymentModal, setShowPaymentModal,
    selectedOrder, selectedOrderForPayment, setSelectedOrderForPayment,
    showQuickCustomerModal, setShowQuickCustomerModal,
    quickCustomerData, setQuickCustomerData,
    newOrder, setNewOrder,
    paymentData, setPaymentData,
    componentRef, orderToPrint, setOrderToPrint,

    resetFilters, loadData,
    handleAddItem, handleRemoveItem, handleItemChange,
    calculateTotal,
    handleQuickCustomerSubmit,
    handlePaymentSubmit,
    handleSubmit,
    handleDuplicateOrder,
    handleExport,
    openPayment, openDetails, closeDetails,
  } = useSalesOrders();

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">إدارة أوامر البيع</h1>
          <div className="flex gap-4">
            <button onClick={handleExport} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel
            </button>
            <button
              onClick={() => syncInvoices(['sales_invoices', 'invoice_line_items']).finally(loadData)}
              disabled={syncing}
              className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 px-4 py-2 rounded-lg border border-teal-500/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudDownload className="w-4 h-4" />
              {syncing ? 'جارٍ الاستيراد...' : 'استيراد من Peachtree'}
            </button>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40">
              <Plus className="w-5 h-5" />
              أمر بيع جديد
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <SalesOrderFilters filters={filters} onFilterChange={setFilters} onReset={resetFilters} />
        <SalesOrdersTable
          orders={orders} loading={loading} filters={filters}
          totalPages={totalPages} totalItems={totalItems}
          onPageChange={setFilters}
          onOpenDetails={openDetails}
          onDuplicate={handleDuplicateOrder}
          onOpenPayment={openPayment}
          onPrint={setOrderToPrint}
        />
      </main>

      <CreateSalesOrderModal
        show={showModal} onClose={() => setShowModal(false)}
        customers={customers} products={products}
        newOrder={newOrder} setNewOrder={setNewOrder}
        onAddItem={handleAddItem} onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange} onSubmit={handleSubmit}
        calculateTotal={calculateTotal}
        onOpenQuickCustomer={() => setShowQuickCustomerModal(true)}
      />

      <OrderDetailsModal order={selectedOrder} onClose={closeDetails} />

      <PaymentModal
        show={showPaymentModal} order={selectedOrderForPayment}
        paymentData={paymentData} setPaymentData={setPaymentData}
        onSubmit={handlePaymentSubmit}
        onClose={() => { setShowPaymentModal(false); setSelectedOrderForPayment(null); }}
      />

      <QuickCustomerModal
        show={showQuickCustomerModal}
        data={quickCustomerData} setData={setQuickCustomerData}
        onSubmit={handleQuickCustomerSubmit}
        onClose={() => setShowQuickCustomerModal(false)}
      />

      <SalesOrderPrintTemplate order={orderToPrint} ref={componentRef} />
    </div>
    </ErrorBoundary>
  );
}
