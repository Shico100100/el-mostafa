'use client';

import { useRouter } from 'next/navigation';
import { Package, Layers, ShoppingCart } from 'lucide-react';
import StatCards from '@/components/inventory2/StatCards';
import { useStock } from '@/hooks/inventory2/useStock';
import { StockHeader } from '@/components/inventory2/stock/StockHeader';
import { StockFilters } from '@/components/inventory2/stock/StockFilters';
import { StockTable } from '@/components/inventory2/stock/StockTable';
import { TransferModal } from '@/components/inventory2/stock/TransferModal';

export default function StockPage() {
  const router = useRouter();
  const h = useStock();

  const statsCards = [
    { label: 'إجمالي السجلات', value: h.filteredStock.length, icon: <Layers className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
    { label: 'إجمالي القطع', value: h.totalItems.toLocaleString(), icon: <ShoppingCart className="w-6 h-6 text-green-400" />, color: 'bg-green-500/20' },
    { label: 'الأصناف المتوفرة', value: h.activeCount, icon: <Package className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
  ];

  return (
    <>
      <StockHeader onNavigate={(path) => router.push(path)} />
      <div className="px-8 py-8">
        <StatCards cards={statsCards} />
        <StockFilters search={h.search} onSearchChange={h.setSearch}
          selectedWarehouse={h.selectedWarehouse} onWarehouseChange={h.setSelectedWarehouse}
          selectedType={h.selectedType} onTypeChange={h.setSelectedType}
          warehouses={h.warehouses} />
        {h.loading ? (
          <div className="text-center text-[#6b8378] py-20">جاري التحميل...</div>
        ) : (
          <StockTable items={h.filteredStock} warehousesCount={h.warehouses.length} onTransfer={h.openTransfer} />
        )}
      </div>
      <TransferModal show={h.showTransfer} item={h.transferItem} warehouses={h.warehouses}
        transferForm={h.transferForm} onFormChange={h.setTransferForm}
        onConfirm={h.handleTransfer} onClose={() => h.setShowTransfer(false)} />
    </>
  );
}
