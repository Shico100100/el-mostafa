'use client';

import { useBulkPrices } from '@/hooks/inventory/useBulkPrices';
import { BulkPricesHeader } from '@/components/inventory/bulk-prices/BulkPricesHeader';
import { UpdateSettings } from '@/components/inventory/bulk-prices/UpdateSettings';
import { ProductFilters } from '@/components/inventory/bulk-prices/ProductFilters';
import { ProductPriceTable } from '@/components/inventory/bulk-prices/ProductPriceTable';

export default function BulkPricesPage() {
  const h = useBulkPrices();

  return (
    <>
      <BulkPricesHeader selectedCount={h.selectedIds.size} saving={h.saving} onApply={h.handleApply} />

      <div className="px-8 py-8">
        <UpdateSettings
          priceField={h.priceField}
          updateType={h.updateType}
          value={h.value}
          selectedCount={h.selectedIds.size}
          onPriceFieldChange={h.setPriceField}
          onUpdateTypeChange={h.setUpdateType}
          onValueChange={h.setValue}
        />

        <ProductFilters
          search={h.search}
          typeFilter={h.typeFilter}
          selectAll={h.selectAll}
          filteredCount={h.filtered.length}
          onSearchChange={h.setSearch}
          onTypeFilterChange={h.setTypeFilter}
          onSelectAllToggle={() => h.setSelectAll(!h.selectAll)}
        />

        <ProductPriceTable
          products={h.filtered}
          loading={h.loading}
          selectedIds={h.selectedIds}
          onToggle={h.toggleProduct}
        />
      </div>
    </>
  );
}
