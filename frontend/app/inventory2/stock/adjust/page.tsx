'use client';

import { useRouter } from 'next/navigation';
import { useAdjust } from '@/hooks/inventory2/useAdjust';
import { AdjustHeader } from '@/components/inventory2/adjust/AdjustHeader';
import { AdjustForm } from '@/components/inventory2/adjust/AdjustForm';

export default function AdjustPage() {
  const router = useRouter();
  const h = useAdjust();

  if (h.loading) {
    return <div className="flex items-center justify-center min-h-screen text-[#6b8378]">جاري التحميل...</div>;
  }

  return (
    <>
      <AdjustHeader onBack={() => router.push('/inventory2/stock')} />
      <div className="px-8 py-8 max-w-2xl mx-auto">
        <AdjustForm products={h.products} warehouses={h.warehouses}
          productId={h.productId} warehouseId={h.warehouseId}
          newQuantity={h.newQuantity} notes={h.notes} saving={h.saving}
          currentQty={h.currentQty} selectedProduct={h.selectedProduct} currentStock={h.currentStock}
          onProductChange={h.setProductId} onWarehouseChange={h.setWarehouseId}
          onQuantityChange={h.setNewQuantity} onNotesChange={h.setNotes}
          onSubmit={h.handleSubmit} onCancel={() => router.push('/inventory2/stock')} />
      </div>
    </>
  );
}
