'use client';

import { usePurchaseReturns } from '@/hooks/purchases/usePurchaseReturns';
import { PurchaseReturnsHeader } from '@/components/purchases/returns/PurchaseReturnsHeader';
import { ReturnsTable } from '@/components/purchases/returns/ReturnsTable';
import { NewReturnModal } from '@/components/purchases/returns/NewReturnModal';

export default function PurchaseReturnsPage() {
  const h = usePurchaseReturns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05080a] via-[#0a0f0d] to-[#05080a] text-[#ecfdf5] p-8 pt-24" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <PurchaseReturnsHeader onNewReturn={() => h.setShowNewModal(true)} />
        <ReturnsTable returns={h.returns} loading={h.loading} />
      </div>
      <NewReturnModal visible={h.showNewModal} suppliers={h.suppliers} orders={h.orders} newReturn={h.newReturn}
        onClose={() => h.setShowNewModal(false)}
        onSupplierChange={h.handleSupplierChange}
        onOrderChange={h.handleOrderChange}
        onDateChange={(date) => h.setNewReturn({ ...h.newReturn, return_date: date })}
        onReasonChange={(reason) => h.setNewReturn({ ...h.newReturn, reason })}
        onItemQtyChange={h.updateItemQty}
        onSubmit={h.handleSubmit} />
    </div>
  );
}
