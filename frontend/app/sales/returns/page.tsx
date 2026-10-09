'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSalesReturns } from '@/hooks/sales/useSalesReturns';
import { SalesReturnsHeader } from '@/components/sales/returns/SalesReturnsHeader';
import { ReturnsTable } from '@/components/sales/returns/ReturnsTable';
import { NewReturnModal } from '@/components/sales/returns/NewReturnModal';

function SalesReturnsContent() {
  const h = useSalesReturns();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) h.openForOrder(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0a0f0d] to-[#0a0f0d] text-[#ecfdf5] p-8 pt-24" dir="rtl">
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

export default function SalesReturnsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen text-center py-20 text-gray-400" dir="rtl">جاري التحميل...</div>}>
      <SalesReturnsContent />
    </Suspense>
  );
}
