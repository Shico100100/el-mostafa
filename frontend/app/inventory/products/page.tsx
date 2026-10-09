/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import type { BOM, Product } from '@/components/inventory/types';
import { PRODUCT_TYPE_OPTIONS } from '@/components/inventory/types';
import StatCards from '@/components/inventory/StatCards';
import FilterBar from '@/components/inventory/FilterBar';
import { useProducts } from '@/hooks/inventory/useProducts';
import AddEditProductModal from '@/components/inventory/modals/AddEditProductModal';
import ImportPreviewDialog from '@/components/inventory/modals/ImportPreviewDialog';
import StockAdjustModal from '@/components/inventory/modals/StockAdjustModal';
import { InventoryProductsHeader } from '@/components/inventory/products/InventoryProductsHeader';
import { InventoryProductsTable } from '@/components/inventory/products/InventoryProductsTable';

const typeOptions = PRODUCT_TYPE_OPTIONS;

function toProductData(p: Product) {
  return {
    id: p.id, name: p.name, type: p.type, unit: p.unit,
    cost_price: p.cost_price != null ? Number(p.cost_price) : null,
    category_id: p.category_id || undefined,
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
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  useEffect(() => {
    api.fetchWithAuth<{ items: BOM[] }>('/manufacturing/boms').then((d) => setBoms(d?.items || [])).catch(() => {});
  }, []);

  // Value and shortage cards use server-side totals across ALL products;
  // the table page holds only 20 rows, so page-scoped sums would lie.
  const statsCards = [
    { label: 'إجمالي المنتجات', value: h.summary?.totalProducts ?? h.totalItems, icon: <Package className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
    { label: 'المعروض', value: h.sortedProducts.length, icon: <Package className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
    { label: 'قيمة المخزون', value: h.summary ? Math.round(h.summary.totalValue).toLocaleString() : '...', icon: <TrendingUp className="w-6 h-6 text-green-400" />, color: 'bg-green-500/20' },
    { label: 'نواقص', value: h.summary ? h.summary.lowStockCount : '...', icon: <AlertTriangle className="w-6 h-6 text-red-400" />, color: 'bg-red-500/20',
      onClick: () => { h.setShowLowStock(true); h.setPage(1); }, title: 'عرض المنتجات الناقصة فقط' },
  ];

  return (
    <>
      <InventoryProductsHeader totalItems={h.totalItems} page={h.page} totalPages={h.totalPages}
        onImportClick={() => document.getElementById('import-file')?.click()}
        onExport={h.handleExport}
        onSmartAssign={h.handleSmartAssign} onSemiFinished={() => router.push('/inventory/semi-finished')}
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
        <input type="file" accept=".xlsx,.xls" onChange={h.previewImport} id="import-file" className="hidden" />
        {(h.importPreviewing || h.importPreview) && (
          <ImportPreviewDialog
            preview={h.importPreview}
            loading={h.importPreviewing}
            onConfirm={h.confirmImport}
            onClose={h.cancelImport}
          />
        )}
        {h.selectedIds.size > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-white font-semibold text-sm">
              محدد: {h.selectedIds.size}
            </span>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              aria-label="الفئة المستهدفة للنقل الجماعي"
              className="px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">اختر الفئة...</option>
              {h.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!bulkCategoryId) return;
                h.handleBulkAssignCategory(Number(bulkCategoryId));
              }}
              disabled={!bulkCategoryId}
              className="px-4 py-2 bg-sky-600/20 hover:bg-sky-600/40 text-sky-200 rounded-lg text-sm transition disabled:opacity-40"
            >
              نقل للفئة
            </button>
            <button
              onClick={h.confirmBulkDelete}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-lg text-sm transition"
            >
              حذف المحدد
            </button>
            <button
              onClick={h.clearSelection}
              className="text-[#6b8378] hover:text-white text-sm transition mr-auto"
            >
              مسح التحديد
            </button>
          </div>
        )}
        <InventoryProductsTable products={h.sortedProducts} loading={h.loading}
          sortField={h.sortField} sortDir={h.sortDir} onToggleSort={h.toggleSort}
          inlineEditingId={h.inlineEditingId} editForm={h.editForm} onEditFormChange={(f) => h.setEditForm(f as any)}
          onStartInlineEdit={h.startInlineEdit} onSaveInlineEdit={h.saveInlineEdit}
          onOpenAdjustment={h.openAdjustment}
          onEditFull={(p) => { h.setEditingProduct(p); h.setShowModal(true); }}
          onDuplicate={(p) => { const dup = { ...p, id: 0 as any, name: `${p.name} (نسخة)`, stock_quantity: '0' }; h.setEditingProduct(dup as any); h.setShowModal(true); }}
          onMarkDormant={h.handleMarkDormant} onRestoreProduct={h.handleRestoreProduct}
          onDelete={h.handleDelete}           onRowClick={(id) => router.push(`/inventory/products/${id}`)}
          selectedIds={h.selectedIds} onToggleSelect={h.toggleSelect} onToggleSelectPage={h.toggleSelectPage}
          boms={boms} latestPrices={h.latestPrices} margin={h.margin}
          page={h.page} totalPages={h.totalPages} totalItems={h.totalItems} onPageChange={h.setPage} />
      </div>
      <AddEditProductModal isOpen={h.showModal} product={h.editingProduct ? toProductData(h.editingProduct) : null}
        warehouses={h.warehouses} categories={h.categories} onClose={() => { h.setShowModal(false); h.setEditingProduct(null); }} onSave={h.handleSaveProduct} />
      <StockAdjustModal productId={h.adjustingId} onClose={() => h.setAdjustingId(null)} onSave={h.saveAdjustment} />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center text-[#6b8378] py-20">جاري التحميل...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
