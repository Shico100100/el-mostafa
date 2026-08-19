'use client';

import { useRouter } from 'next/navigation';
import { useTransfer } from '@/hooks/inventory2/useTransfer';
import { TransferHeader } from '@/components/inventory2/transfer/TransferHeader';
import { TransferForm } from '@/components/inventory2/transfer/TransferForm';

export default function TransferPage() {
  const router = useRouter();
  const h = useTransfer();

  if (h.loading) {
    return <div className="flex items-center justify-center min-h-screen text-[#6b8378]">جاري التحميل...</div>;
  }

  return (
    <>
      <TransferHeader onBack={() => router.push('/inventory2/stock')} />
      <div className="px-8 py-8 max-w-2xl mx-auto">
        <TransferForm products={h.products} warehouses={h.warehouses}
          productId={h.productId} fromWarehouseId={h.fromWarehouseId} toWarehouseId={h.toWarehouseId}
          quantity={h.quantity} notes={h.notes} saving={h.saving} maxQty={h.maxQty} selectedProduct={h.selectedProduct}
          onProductChange={h.setProductId} onFromWarehouseChange={h.setFromWarehouseId}
          onToWarehouseChange={h.setToWarehouseId} onQuantityChange={h.setQuantity}
          onNotesChange={h.setNotes} onSubmit={h.handleSubmit}
          onCancel={() => router.push('/inventory2/stock')} />
      </div>
    </>
  );
}
