'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Product } from '@/components/inventory/types';

interface Warehouse { id: number; name: string; }
interface ProductResponse { data: Product[]; total: number; totalPages: number; page: number; limit: number; }
interface ProductData {
  id?: number; name: string; type: string; unit: string;
  cost_price?: number | null; category_id?: number;
  selling_price: number; stock_quantity: number;
  min_stock?: number | null; warehouse_id?: number; description?: string | null;
  weight_grams?: number | null; image_path?: string | null;
}

export function useProducts() {
  const ready = useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ selling_price: '', stock_quantity: '' });
  const [adjustingId, setAdjustingId] = useState<number | null>(null);

  // Filter state initializes from the URL so a detail view opened in a new
  // tab (or back-navigation) restores the list exactly as it was.
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '');
  const [selectedType, setSelectedType] = useState(() => searchParams.get('type') ?? '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => searchParams.get('warehouse') ?? '');
  const [showLowStock, setShowLowStock] = useState(() => searchParams.get('low') === '1');
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{ totalProducts: number; totalValue: number; lowStockCount: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // One-way sync state -> URL (replace, no scroll, no remount loop).
  useEffect(() => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (selectedType) qs.set('type', selectedType);
    if (selectedWarehouse) qs.set('warehouse', selectedWarehouse);
    if (showLowStock) qs.set('low', '1');
    if (page > 1) qs.set('page', String(page));
    const suffix = qs.toString();
    router.replace(`/inventory/products${suffix ? `?${suffix}` : ''}`, { scroll: false });
  }, [search, selectedType, selectedWarehouse, showLowStock, page, router]);

  const [sortField, setSortField] = useState<'name' | 'type' | 'cost_price' | 'selling_price' | 'stock_quantity' | 'margin'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [latestPrices, setLatestPrices] = useState<Record<number, { price: number; date: string | null }>>({});

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  // Selections reference row ids, which vanish on accept/delete and are
  // rebuilt by every fresh sync — prune the dead ones instead of acting on
  // stale ids.
  const productIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  useEffect(() => {
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<number>();
      for (const id of prev) {
        if (productIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [productIds]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (debouncedSearch) qs.append('search', debouncedSearch);
      if (selectedType) qs.append('type', selectedType);
      if (showLowStock) qs.append('lowStock', 'true');
      if (selectedWarehouse) qs.append('warehouseId', selectedWarehouse);

      const [productsData, warehousesData, categoriesData, summaryData] = await Promise.all([
        api.fetchWithAuth<ProductResponse | Product[]>(`/inventory/products?${qs.toString()}`),
        api.fetchWithAuth<Warehouse[]>('/inventory/warehouses'),
        api.fetchWithAuth<{ id: number; name: string }[]>('/inventory/categories').catch(() => []),
        api.fetchWithAuth<{ totalProducts: number; totalValue: number; lowStockCount: number }>('/inventory/products/summary').catch(() => null),
      ]);

      if (Array.isArray(productsData)) {
        setProducts(productsData);
        setTotalPages(1);
        setTotalItems(productsData.length);
      } else {
        setProducts(productsData.data || []);
        setTotalPages(productsData.totalPages || 1);
        setTotalItems(productsData.total || 0);
      }
      setWarehouses(warehousesData || []);
      setCategories(categoriesData || []);
      if (summaryData) setSummary(summaryData);

      // Fetch latest purchase prices for invoice-priced products
      const prodList = Array.isArray(productsData) ? productsData : (productsData.data || []);
      const invoicePriced = prodList.filter(
        (p) => p.type === 'IMPORTED' || p.type === 'PACKAGING' || p.type === 'RAW_PLASTIC'
      ).map((p) => p.id);
      if (invoicePriced.length > 0) {
        api.getLatestPurchasePrices(invoicePriced).then(setLatestPrices).catch(() => {});
      }
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally { setLoading(false); }
  }, [page, debouncedSearch, selectedType, showLowStock, selectedWarehouse]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = String(a.name || '').localeCompare(String(b.name || '')); break;
        case 'type': cmp = String(a.type || '').localeCompare(String(b.type || '')); break;
        case 'cost_price': cmp = Number(a.cost_price) - Number(b.cost_price); break;
        case 'selling_price': cmp = Number(a.selling_price) - Number(b.selling_price); break;
        case 'stock_quantity': cmp = Number(a.stock_quantity) - Number(b.stock_quantity); break;
        case 'margin': {
          const mA = Number(a.cost_price) > 0 ? ((Number(a.selling_price) - Number(a.cost_price)) / Number(a.cost_price)) : 0;
          const mB = Number(b.cost_price) > 0 ? ((Number(b.selling_price) - Number(b.cost_price)) / Number(b.cost_price)) : 0;
          cmp = mA - mB;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, sortField, sortDir]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/products/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('تم التصدير');
    } catch { toast.error('فشل التصدير'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/products/import', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`تم الاستيراد: ${result.created} إضافة، ${result.updated} تحديث`);
        loadData();
      } else toast.error('فشل الاستيراد');
    } catch { toast.error('خطأ في الاستيراد'); }
    e.target.value = '';
  };

  // Exactly the keys CreateProductDto accepts. The edit form is spread from
  // the full Product row (id, warehouse/category objects, timestamps...),
  // and the API rejects unknown props (forbidNonWhitelisted) with 422 — so
  // only known keys may leave the client.
  // Mirrors CreateProductDto minus sku/barcode (removed from the API: the
  // edit form spreads the full list row, which still carries them, and the
  // API rejects unknown props with 422.
  const PRODUCT_PAYLOAD_KEYS = [
    'name',
    'cost_price',
    'selling_price',
    'category_id',
    'warehouse_id',
    'unit',
    'type',
    'description',
    'min_stock',
    'weight_grams',
    'image_path',
    'raw_material_type',
    'initial_stock',
  ] as const;

  const handleSaveProduct = async (data: ProductData) => {
    try {
      const source = data as unknown as Record<string, unknown>;
      const payload: Record<string, unknown> = {};
      for (const k of PRODUCT_PAYLOAD_KEYS) {
        if (source[k] !== undefined) payload[k] = source[k];
      }
      // Route by id like the modal does (product?.id): a duplicate carries
      // id 0 and must POST as new, not PUT over product 0.
      if (editingProduct?.id) {
        await api.fetchWithAuth(`/inventory/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('تم التحديث');
      } else {
        const initialStock =
          data.stock_quantity === undefined
            ? undefined
            : Number(data.stock_quantity);
        await api.fetchWithAuth('/inventory/products', { method: 'POST', body: JSON.stringify({ ...payload, initial_stock: initialStock }) });
        toast.success('تمت الإضافة');
      }
      setShowModal(false);
      setEditingProduct(null);
      loadData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'فشل الحفظ'); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const pageIds = products.map((p) => p.id);
      const allSelected =
        pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const executeBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    try {
      const result = await api.fetchWithAuth<{ deleted: number }>('/inventory/products/bulk-delete', {
        method: 'POST', body: JSON.stringify({ ids }),
      });
      toast.success(`تم حذف ${result.deleted} منتج`);
      clearSelection();
      loadData();
    } catch { toast.error('فشل الحذف الجماعي'); }
  };

  const confirmBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    toast.custom((t: number | string) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-2">حذف {ids.length} منتج؟</p>
        <p className="text-slate-400 text-sm mb-4">الحذف نهائي ولا يمكن التراجع عنه.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => { toast.dismiss(t); await executeBulkDelete(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleBulkAssignCategory = async (categoryId: number) => {
    const ids = [...selectedIds];
    if (ids.length === 0 || !categoryId) return;
    try {
      const result = await api.fetchWithAuth<{ updated: number }>('/inventory/products/bulk-assign-category', {
        method: 'POST', body: JSON.stringify({ ids, category_id: categoryId }),
      });
      toast.success(`تم نقل ${result.updated} منتج للفئة`);
      clearSelection();
      loadData();
    } catch { toast.error('فشل نقل الفئة'); }
  };

  const handleDelete = (id: number) => {
    toast.custom((t: number | string) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">هل أنت متأكد من الحذف؟</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => { toast.dismiss(t); try { await api.fetchWithAuth(`/inventory/products/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); loadData(); } catch { toast.error('فشل الحذف'); } }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const startInlineEdit = (product: Product) => {
    setInlineEditingId(product.id);
    setEditForm({ selling_price: String(Number(product.selling_price)), stock_quantity: String(Number(product.stock_quantity)) });
  };

  const saveInlineEdit = async (id: number) => {
    try {
      await api.fetchWithAuth(`/inventory/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ selling_price: Number(editForm.selling_price), initial_stock: Number(editForm.stock_quantity) }),
      });
      setInlineEditingId(null);
      toast.success('تم الحفظ');
      loadData();
    } catch { toast.error('فشل الحفظ'); }
  };

  const openAdjustment = (id: number) => setAdjustingId(id);

  const saveAdjustment = async (productId: number, data: { type: 'IN' | 'OUT'; quantity: string; notes: string }) => {
    if (!data.quantity || Number(data.quantity) <= 0) return;
    try {
      const whId = selectedWarehouse || (warehouses.length > 0 ? String(warehouses[0].id) : '1');
      await api.fetchWithAuth('/inventory/stock/movement', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, warehouse_id: parseInt(whId), type: data.type, quantity: Number(data.quantity), notes: data.notes || undefined }),
      });
      setAdjustingId(null);
      toast.success(data.type === 'IN' ? 'تمت الإضافة' : 'تم الخصم');
      loadData();
    } catch { toast.error('فشل التعديل'); }
  };

  const handleMarkDormant = async (productId: number) => {
    toast.custom((t: number | string) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">نقل المنتج إلى المخزن الخامل؟</p>
        <p className="text-slate-400 text-sm mb-4">سيتم نقل المخزون الحالي إلى المخزن الخامل وإخفاء المنتج من القائمة الافتراضية</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try {
              await api.markProductAsDormant(productId);
              toast.success('تم نقل المنتج للخامل');
              loadData();
            } catch { toast.error('فشل نقل المنتج'); }
          }} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">نقل</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleRestoreProduct = async (productId: number) => {
    toast.custom((t: number | string) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">استرجاع المنتج من الخامل؟</p>
        <p className="text-slate-400 text-sm mb-4">سيتم نقل المخزون إلى مخزن المنتج التام وإعادة المنتج للقائمة</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try {
              await api.restoreProduct(productId);
              toast.success('تم استرجاع المنتج');
              loadData();
            } catch { toast.error('فشل الاسترجاع'); }
          }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">استرجاع</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleSmartAssign = async () => {
    try {
      const result = await api.fetchWithAuth<{ message: string }>('/inventory/products/smart-assign', { method: 'POST' });
      toast.success(result.message || 'تم التوزيع');
      loadData();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'فشل التوزيع'); }
  };

  const margin = (p: Product) => {
    const cost = Number(p.cost_price);
    const sell = Number(p.selling_price);
    if (cost <= 0) return { value: 0, pct: 0 };
    const m = sell - cost;
    return { value: m, pct: (m / cost) * 100 };
  };

  return {
    products, warehouses, categories, loading, showModal, editingProduct, summary, selectedIds,
    inlineEditingId, editForm, adjustingId,
    search, selectedType, selectedWarehouse, showLowStock,
    page, totalPages, totalItems, sortField, sortDir, sortedProducts, latestPrices,
    setSearch, setSelectedType, setSelectedWarehouse, setShowLowStock,
    setPage, setShowModal, setEditingProduct,
    setEditForm, setInlineEditingId, setAdjustingId,
    loadData, toggleSort, handleExport, handleImport, handleSaveProduct,
    handleDelete, startInlineEdit, saveInlineEdit, openAdjustment, saveAdjustment,
    handleSmartAssign, handleMarkDormant, handleRestoreProduct, margin,
    toggleSelect, toggleSelectPage, clearSelection, confirmBulkDelete, executeBulkDelete, handleBulkAssignCategory,
  };
}
