'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Product, Category, Warehouse, SortField, SortDir } from '@/components/inventory/types';

export function useProducts() {
  const ready = useAuthCheck();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkPrice, setShowBulkPrice] = useState(false);

  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ selling_price: '', stock_quantity: '' });

  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'IN' as 'IN' | 'OUT', notes: '' });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [bulkPriceForm, setBulkPriceForm] = useState({
    priceField: 'selling_price' as 'selling_price' | 'cost_price',
    updateType: 'percentage' as 'percentage' | 'fixed',
    value: '',
    categoryId: '',
    type: '',
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (selectedCategory) queryParams.append('categoryId', selectedCategory);
      if (selectedType) queryParams.append('type', selectedType);
      if (showLowStock) queryParams.append('lowStock', 'true');
      if (selectedWarehouse) queryParams.append('warehouseId', selectedWarehouse);

      const [productsData, categoriesData, warehousesData] = await Promise.all([
        api.fetchWithAuth(`/inventory/products?${queryParams.toString()}`),
        api.fetchWithAuth('/inventory/categories'),
        api.fetchWithAuth('/inventory/warehouses'),
      ]);

      if (productsData.data) {
        setProducts(productsData.data);
        setTotalPages(productsData.totalPages);
        setTotalItems(productsData.total);
      } else {
        setProducts(Array.isArray(productsData) ? productsData : []);
      }

      setCategories(sortAlphabetically(categoriesData || [], 'name'));
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedType, showLowStock, selectedWarehouse]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const handleInitWarehouses = async () => {
    try {
      const result = await api.fetchWithAuth('/inventory/warehouses/init', { method: 'POST' });
      toast.success(result.message || 'تم تهيئة المخازن');
      loadData();
    } catch {
      toast.error('فشل تهيئة المخازن');
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'cost_price': cmp = a.cost_price - b.cost_price; break;
        case 'selling_price': cmp = a.selling_price - b.selling_price; break;
        case 'stock_quantity': cmp = a.stock_quantity - b.stock_quantity; break;
        case 'margin': {
          const mA = a.cost_price > 0 ? ((a.selling_price - a.cost_price) / a.cost_price) : 0;
          const mB = b.cost_price > 0 ? ((b.selling_price - b.cost_price) / b.cost_price) : 0;
          cmp = mA - mB;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, sortField, sortDir]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/products/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_inventory.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('تم تصدير البيانات بنجاح');
    } catch {
      toast.error('فشل تصدير البيانات');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/products/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`تم استيراد البيانات: ${result.created} إضافة، ${result.updated} تحديث`);
        loadData();
      } else {
        toast.error('فشل استيراد البيانات');
      }
    } catch {
      toast.error('حدث خطأ أثناء الاستيراد');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const warehouseId = formData.get('warehouse_id');
    const data: Record<string, unknown> = {
      name: formData.get('name'),
      warehouse_id: warehouseId ? parseInt(warehouseId as string) : undefined,
      unit: formData.get('unit') || 'piece',
      type: formData.get('type') || 'FINISHED',
      selling_price: formData.get('selling_price') ? parseFloat(formData.get('selling_price') as string) : 0,
      cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : 0,
      min_stock: formData.get('min_stock') ? parseInt(formData.get('min_stock') as string) : 0,
      sku: formData.get('sku') || undefined,
      barcode: formData.get('barcode') || undefined,
      category_id: formData.get('category_id') ? parseInt(formData.get('category_id') as string) : undefined,
      description: formData.get('description') || undefined,
      image_path: formData.get('image_path') || undefined,
      weight_grams: formData.get('weight_grams') ? parseFloat(formData.get('weight_grams') as string) : undefined,
    };
    try {
      if (editingProduct) {
        await api.fetchWithAuth(`/inventory/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await api.fetchWithAuth('/inventory/products', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة المنتج بنجاح');
      }
      setShowModal(false);
      setEditingProduct(null);
      loadData();
    } catch {
      toast.error('فشل حفظ المنتج');
    }
  };

  const handleDelete = (id: number) => {
    toast.custom((t) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">هل أنت متأكد من حذف هذا المنتج؟</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition"
          >
            إلغاء
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await api.fetchWithAuth(`/inventory/products/${id}`, { method: 'DELETE' });
                toast.success('تم حذف المنتج');
                loadData();
              } catch {
                toast.error('فشل حذف المنتج');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            حذف
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const startInlineEdit = (product: Product) => {
    setInlineEditingId(product.id);
    setEditForm({
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
  };

  const saveInlineEdit = async (id: number) => {
    try {
      await api.fetchWithAuth(`/inventory/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          selling_price: parseFloat(editForm.selling_price),
          initial_stock: parseFloat(editForm.stock_quantity)
        }),
      });
      setInlineEditingId(null);
      toast.success('تم حفظ التعديل');
      loadData();
    } catch {
      toast.error('فشل حفظ التعديل');
    }
  };

  const openAdjustment = (product: Product) => {
    setAdjustingId(product.id);
    setAdjustForm({ quantity: '', type: 'IN', notes: '' });
  };

  const saveAdjustment = async (productId: number, data: { type: 'IN' | 'OUT'; quantity: string; notes: string }) => {
    if (!data.quantity) return;
    try {
      const warehouseId = selectedWarehouse || (warehouses.length > 0 ? String(warehouses[0].id) : '');
      await api.fetchWithAuth('/inventory/stock/movement', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          warehouse_id: parseInt(warehouseId),
          type: data.type,
          quantity: parseFloat(data.quantity),
          notes: data.notes || undefined,
        }),
      });
      setAdjustingId(null);
      toast.success(data.type === 'IN' ? 'تم إضافة المخزون' : 'تم خصم المخزون');
      loadData();
    } catch {
      toast.error('فشل تعديل المخزون');
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPriceForm.value) {
      toast.error('الرجاء إدخال القيمة');
      return;
    }
    try {
      const result = await api.fetchWithAuth('/inventory/products/bulk-update-prices', {
        method: 'POST',
        body: JSON.stringify({
          priceField: bulkPriceForm.priceField,
          updateType: bulkPriceForm.updateType,
          value: parseFloat(bulkPriceForm.value),
          categoryId: bulkPriceForm.categoryId ? parseInt(bulkPriceForm.categoryId) : undefined,
          type: bulkPriceForm.type || undefined,
        }),
      });
      toast.success(`تم تحديث ${result.updated} منتج بنجاح`);
      setShowBulkPrice(false);
      loadData();
    } catch {
      toast.error('فشل التحديث الجماعي للأسعار');
    }
  };

  const handleSmartAssign = async () => {
    try {
      const result = await api.fetchWithAuth('/inventory/products/smart-assign', { method: 'POST' });
      toast.success(result.message || 'تم التوزيع بنجاح');
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل التوزيع الذكي');
    }
  };

  const margin = (p: Product) => {
    if (p.cost_price <= 0) return { value: 0, pct: 0 };
    const m = p.selling_price - p.cost_price;
    const pct = (m / p.cost_price) * 100;
    return { value: m, pct };
  };

  return {
    // State
    products,
    categories,
    warehouses,
    loading,
    showModal,
    editingProduct,
    showBulkPrice,
    inlineEditingId,
    editForm,
    adjustingId,
    adjustForm,
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
    bulkPriceForm,
    sortedProducts,

    // Setters
    setSearch,
    setSelectedCategory,
    setSelectedType,
    setSelectedWarehouse,
    setShowLowStock,
    setPage,
    setShowModal,
    setEditingProduct,
    setShowBulkPrice,
    setBulkPriceForm,
    setInlineEditingId,
    setEditForm,
    setAdjustingId,
    setAdjustForm,

    // Actions
    loadData,
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
  };
}
