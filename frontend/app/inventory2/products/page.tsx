/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { BOM, Product } from '@/components/inventory2/types';
import StatCards from '@/components/inventory2/StatCards';
import FilterBar from '@/components/inventory2/FilterBar';
import { useProducts } from '@/hooks/inventory2/useProducts';
import AddEditProductModal from '@/components/inventory2/modals/AddEditProductModal';
import StockAdjustModal from '@/components/inventory2/modals/StockAdjustModal';
import BulkPriceModal from '@/components/inventory2/modals/BulkPriceModal';
import { Inventory2ProductsHeader } from '@/components/inventory2/products/Inventory2ProductsHeader';
import { Inventory2ProductsTable } from '@/components/inventory2/products/Inventory2ProductsTable';

const typeOptions = [
  { value: 'FINISHED', label: 'منتج تام' },
  { value: 'IMPORTED', label: 'مستورد' },
  { value: 'PACKAGING', label: 'تغليف' },
  { value: 'RAW', label: 'خام' },
  { value: 'SEMI_FINISHED', label: 'نصف مصنع' },
];

function toProductData(p: Product) {
  return {
    id: p.id, name: p.name, type: p.type, unit: p.unit,
    selling_price: Number(p.selling_price), stock_quantity: Number(p.stock_quantity),
    min_stock: p.min_stock ? Number(p.min_stock) : null, warehouse_id: p.warehouse_id || undefined,
    description: (p as any).description || null, weight_grams: (p as any).weight_grams ? Number((p as any).weight_grams) : null,
    image_path: (p as any).image_path || null,
  };
}

function ProductsPageContent() {
  const router = useRouter();
  const h = useProducts();
  const [boms, setBoms] = useState<BOM[]>([]);

  useEffect(() => {
    api.fetchWithAuth<{ items: BOM[] }>('/manufacturing/boms').then((d) => setBoms(d?.items || [])).catch(() => {});
  }, []);

  const statsCards = [
    { label: 'إجمالي المنتجات', value: h.totalItems, icon: <Package className="w-6 h-6 text-blue-400" />, color: 'bg-blue-500/20' },
    { label: 'المعروض', value: h.sortedProducts.length, icon: <Package className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
    { label: 'قيمة المخزون', value: (() => { try { return h.sortedProducts.reduce((s: number, p: Product) => s + Number(p.cost_price) * Number(p.stock_quantity), 0).toLocaleString(); } catch { return '0'; } })(), icon: <TrendingUp className="w-6 h-6 text-green-400" />, color: 'bg-green-500/20' },
    { label: 'نواقص', value: h.sortedProducts.filter((p: Product) => Number(p.stock_quantity) <= Number(p.min_stock || 0)).length, icon: <AlertTriangle className="w-6 h-6 text-red-400" />, color: 'bg-red-500/20' },
  ];

  return (
    <>
      <Inventory2ProductsHeader totalItems={h.totalItems} page={h.page} totalPages={h.totalPages}
        onImportClick={() => document.getElementById('import-file')?.click()}
        onExport={h.handleExport} onBulkPrice={() => h.setShowBulkPrice(true)}
        onSmartAssign={h.handleSmartAssign} onSemiFinished={() => router.push('/inventory2/semi-finished')}
        onAddProduct={() => { h.setEditingProduct(null); h.setShowModal(true); }} />
      <div className="px-8 py-8">
        <StatCards cards={statsCards} />
        <FilterBar
          search={h.search} onSearchChange={(v) => { h.setSearch(v); h.setPage(1); }}
          searchPlaceholder="بحث (اسم، كود...)"
          selects={[
            { value: h.selectedType, onChange: (v) => { h.setSelectedType(v); h.setPage(1); }, options: typeOptions, placeholder: 'كل الأنواع' },
            { value: h.selectedWarehouse, onChange: (v) => { h.setSelectedWarehouse(v); h.setPage(1); }, options: h.warehouses.map((w: any) => ({ value: String(w.id), label: w.name })), placeholder: 'كل المخازن' },
          ]}
          toggles={[{ label: 'النواقص فقط', active: h.showLowStock, onClick: () => { h.setShowLowStock(!h.showLowStock); h.setPage(1); }, icon: <AlertTriangle className="w-4 h-4" /> }]}
        />
        <input type="file" accept=".xlsx,.xls" onChange={h.handleImport} id="import-file" className="hidden" />
        <Inventory2ProductsTable products={h.sortedProducts} loading={h.loading}
          sortField={h.sortField} sortDir={h.sortDir} onToggleSort={h.toggleSort}
          inlineEditingId={h.inlineEditingId} editForm={h.editForm} onEditFormChange={(f) => h.setEditForm(f as any)}
          onStartInlineEdit={h.startInlineEdit} onSaveInlineEdit={h.saveInlineEdit}
          onOpenAdjustment={h.openAdjustment}
          onEditFull={(p) => { h.setEditingProduct(p); h.setShowModal(true); }}
          onDuplicate={(p) => { const dup = { ...p, id: 0 as any, name: `${p.name} (نسخة)`, stock_quantity: '0' }; h.setEditingProduct(dup as any); h.setShowModal(true); }}
          onDelete={h.handleDelete} onRowClick={(id) => router.push(`/inventory2/products/${id}`)}
          boms={boms} latestPrices={h.latestPrices} margin={h.margin}
          page={h.page} totalPages={h.totalPages} totalItems={h.totalItems} onPageChange={h.setPage} />
      </div>
      <AddEditProductModal isOpen={h.showModal} product={h.editingProduct ? toProductData(h.editingProduct) : null}
        warehouses={h.warehouses} onClose={() => { h.setShowModal(false); h.setEditingProduct(null); }} onSave={h.handleSaveProduct} />
      <StockAdjustModal productId={h.adjustingId} onClose={() => h.setAdjustingId(null)} onSave={h.saveAdjustment} />
      <BulkPriceModal isOpen={h.showBulkPrice} onClose={() => h.setShowBulkPrice(false)} onSave={h.handleBulkPriceUpdate} />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-20">جاري التحميل...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
