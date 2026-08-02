'use client';

import { ArrowLeft, Warehouse, Plus, FileDown, FileUp, TrendingUp, ClipboardList, Sparkles, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';
import StatCards, { buildProductStats, productStatCards } from '@/components/inventory/StatCards';
import ProductTable from '@/components/inventory/ProductTable';
import Pagination from '@/components/inventory/Pagination';
import StockAdjustModal from '@/components/inventory/modals/StockAdjustModal';
import BulkPriceModal from '@/components/inventory/modals/BulkPriceModal';
import AddEditProductModal from '@/components/inventory/modals/AddEditProductModal';
import { useProducts } from '@/hooks/inventory/useProducts';

export default function ProductsPage() {
  const router = useRouter();
  const {
    products,
    categories,
    warehouses,
    loading,
    showModal,
    editingProduct,
    showBulkPrice,
    inlineEditingId,
    editForm,
    search,
    selectedCategory,
    selectedType,
    selectedWarehouse,
    showLowStock,
    page,
    totalPages,
    totalItems,
    sortField,
    sortDir,
    sortedProducts,

    setSearch,
    setSelectedCategory,
    setSelectedType,
    setSelectedWarehouse,
    setShowLowStock,
    setPage,
    setShowModal,
    setEditingProduct,
    setShowBulkPrice,
    setEditForm,
    adjustingId,
    setAdjustingId,

    handleInitWarehouses,
    toggleSort,
    handleExport,
    handleImport,
    handleSubmit,
    handleDelete,
    startInlineEdit,
    saveInlineEdit,
    openAdjustment,
    saveAdjustment,
    handleBulkPriceUpdate,
    handleSmartAssign,
    margin,
  } = useProducts();

  const stats = buildProductStats(products);

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">إدارة المخزون والمنتجات</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInitWarehouses}
              className="text-xs px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Warehouse className="w-3.5 h-3.5" />
              تهيئة المخازن
            </button>
            <div className="text-xs text-slate-500 font-mono hidden md:block">{totalItems} صنف</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <StatCards cards={productStatCards(stats)} />

        <div className="flex flex-col xl:flex-row gap-4 mb-8 justify-between items-end xl:items-center">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <Plus className="w-5 h-5" />
              إضافة منتج
            </button>
            <button
              onClick={() => document.getElementById('import-file')?.click()}
              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-4 py-3 rounded-xl border border-emerald-500/20 transition flex items-center gap-2"
            >
              <FileUp className="w-5 h-5" />
              استيراد
            </button>
            <input type="file" id="import-file" hidden accept=".xlsx, .xls" onChange={handleImport} />
            <button onClick={handleExport} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl border border-blue-500/20 transition flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              تصدير
            </button>
            <button
              onClick={() => setShowBulkPrice(true)}
              className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-3 rounded-xl border border-purple-500/20 transition flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              تحديث أسعار
            </button>
            <button onClick={() => router.push('/inventory/stock')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl border border-white/5 transition flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              تقرير المخزن
            </button>
            <button onClick={() => router.push('/inventory/warehouses')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl border border-white/5 transition flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              المخازن
            </button>
            <button
              onClick={handleSmartAssign}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-900/30 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-5 h-5" />
              توزيع ذكي
            </button>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap gap-4 items-center w-full xl:w-auto">
            <input
              type="text"
              placeholder="بحث (اسم، كود...)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-w-[200px]"
            />
            <SearchableSelect
              options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              value={selectedCategory}
              onChange={(val) => { setSelectedCategory(val.toString()); setPage(1); }}
              placeholder="كل التصنيفات"
              className="min-w-[180px]"
            />
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">كل الأنواع</option>
                <option value="FINISHED">منتج تام</option>
                <option value="IMPORTED">مستورد</option>
                <option value="RAW_PLASTIC">خام بلاستيك</option>
                <option value="PACKAGING">تغليف</option>
                <option value="RAW">خامة</option>
                <option value="SEMI">نصف مصنع</option>
              </select>
            <select
              value={selectedWarehouse}
              onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 min-w-[160px]"
            >
              <option value="">كل المخازن</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 border ${showLowStock
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-slate-900/50 text-gray-400 border-white/10 hover:border-red-500/50 hover:text-red-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              نواقص
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
        ) : (
          <>
            <ProductTable
              products={sortedProducts}
              sortField={sortField}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              inlineEditingId={inlineEditingId}
              editForm={editForm}
              onEditFormChange={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
              onStartInlineEdit={startInlineEdit}
              onSaveInlineEdit={saveInlineEdit}
              onOpenAdjustment={openAdjustment}
              onEditFull={(product) => {
                setEditingProduct(product);
                setShowModal(true);
              }}
              onDuplicate={(product) => {
                const { ...rest } = product;
                const dup = { ...rest, id: 0, name: `${product.name} (نسخة)`, sku: '', barcode: '', stock_quantity: 0 };
                setEditingProduct(dup);
                setShowModal(true);
              }}
              onDelete={handleDelete}
              loading={loading}
              margin={margin}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={20}
              onPageChange={setPage}
            />
          </>
        )}
      </main>

      <StockAdjustModal
        productId={adjustingId}
        onClose={() => setAdjustingId(null)}
        onSave={saveAdjustment}
      />

      <BulkPriceModal
        isOpen={showBulkPrice}
        onClose={() => setShowBulkPrice(false)}
        categories={categories}
        onSave={handleBulkPriceUpdate}
      />

      <AddEditProductModal
        isOpen={showModal}
        editingProduct={editingProduct}
        categories={categories}
        warehouses={warehouses}
        onClose={() => { setShowModal(false); setEditingProduct(null); }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
