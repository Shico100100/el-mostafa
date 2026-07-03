'use client';

import { useSalesReturns } from '@/hooks/sales/useSalesReturns';
import { SalesReturnsHeader } from '@/components/sales/returns/SalesReturnsHeader';
import { ReturnsTable } from '@/components/sales/returns/ReturnsTable';
import { NewReturnModal } from '@/components/sales/returns/NewReturnModal';

export default function SalesReturnsPage() {
  const h = useSalesReturns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 p-8 pt-24" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <SalesReturnsHeader onNewReturn={h.openModal} />

        <ReturnsTable returns={h.returns} loading={h.loading} />

        <NewReturnModal
          show={h.showNewModal}
          newReturn={h.newReturn}
          customers={h.customers}
          orders={h.orders}
          onClose={() => h.setShowNewModal(false)}
          onCustomerChange={h.handleCustomerChange}
          onOrderChange={h.handleOrderChange}
          onDateChange={(d) => h.setNewReturn({ ...h.newReturn, return_date: d })}
          onReasonChange={(r) => h.setNewReturn({ ...h.newReturn, reason: r })}
          onItemQtyChange={h.updateItemQty}
          total={h.calculateTotal().toLocaleString()}
          onSubmit={h.handleSubmit}
        />
      </div>
    </div>
  );
}
