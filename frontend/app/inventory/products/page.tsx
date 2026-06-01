'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Plus, FileDown, FileUp, ClipboardList, ArrowLeft } from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
    type: 'RAW' | 'SEMI' | 'FINISHED';
    category_id?: number;
    category?: Category;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    unit: string;
    min_stock?: number;
    description?: string;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);


    // Quick Edit State
    const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ selling_price: '', stock_quantity: '' });

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Debounced search logic
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

            const [productsData, categoriesData] = await Promise.all([
                api.fetchWithAuth(`/inventory/products?${queryParams.toString()}`),
                api.fetchWithAuth('/inventory/categories'),
            ]);

            // Handle response format change (now returns { data, total, ... })
            if (productsData.data) {
                setProducts(productsData.data);
                setTotalPages(productsData.totalPages);
                setTotalItems(productsData.total);
            } else {
                // Fallback if backend implementation hasn't deployed or returns array
                setProducts(Array.isArray(productsData) ? productsData : []);
            }

            setCategories(sortAlphabetically(categoriesData, 'name'));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, selectedCategory, selectedType, showLowStock]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router, loadData]);

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
        } catch (error) {
            console.error('Export failed:', error);
            alert('فشل تصدير البيانات');
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
                alert(`تم استيراد البيانات بنجاح: \nتم إضافة: ${result.created}\nتم تحديث: ${result.updated}`);
                loadData();
            } else {
                alert('فشل استيراد البيانات');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('حدث خطأ أثناء الاستيراد');
        }
        // Reset input
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            barcode: formData.get('barcode'),
            type: formData.get('type'),
            category_id: formData.get('category_id'),
            selling_price: parseFloat(formData.get('selling_price') as string || '0'),
            cost_price: parseFloat(formData.get('cost_price') as string || '0'),
            unit: formData.get('unit'),
            description: formData.get('description'),
            min_stock: parseFloat(formData.get('min_stock') as string || '0'),
        };

        try {
            if (editingProduct) {
                await api.fetchWithAuth(`/inventory/products/${editingProduct.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } else {
                await api.fetchWithAuth('/inventory/products', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            }
            setShowModal(false);
            setEditingProduct(null);
            loadData();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        try {
            await api.fetchWithAuth(`/inventory/products/${id}`, { method: 'DELETE' });
            loadData();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
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
                    stock_quantity: parseFloat(editForm.stock_quantity)
                }),
            });
            setInlineEditingId(null);
            loadData();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">إدارة المخزون والمنتجات</h1>
                    </div>
                    <div className="text-xs text-slate-500 font-mono hidden md:block">إحصائيات المنتجات: {totalItems} صنف</div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Actions & Filters */}
                <div className="flex flex-col xl:flex-row gap-4 mb-8 justify-between items-end xl:items-center">
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setShowModal(true);
                            }}
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
                            استيراد Excel
                        </button>
                        <input
                            type="file"
                            id="import-file"
                            hidden
                            accept=".xlsx, .xls"
                            onChange={handleImport}
                        />
                        <button
                            onClick={handleExport}
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl border border-blue-500/20 transition flex items-center gap-2"
                        >
                            <FileDown className="w-5 h-5" />
                            تصدير Excel
                        </button>
                        <button
                            onClick={() => router.push('/inventory/stock')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl border border-white/5 transition flex items-center gap-2"
                        >
                            <ClipboardList className="w-5 h-5" />
                            تقرير المخزن
                        </button>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap gap-4 items-center w-full xl:w-auto">
                        <input
                            type="text"
                            placeholder="بحث (اسم، كود...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-w-[200px]"
                        />
                        <SearchableSelect
                            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val.toString())}
                            placeholder="كل التصنيفات"
                            className="min-w-[180px]"
                        />
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">كل الأنواع</option>
                            <option value="RAW">خادة</option>
                            <option value="SEMI">نصف مصنع</option>
                            <option value="FINISHED">منتج تام</option>
                        </select>

                        <button
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 border ${showLowStock
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-slate-900/50 text-gray-400 border-white/10 hover:border-red-500/50 hover:text-red-400'
                                }`}
                        >
                            ⚠️ نواقص
                        </button>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">الاسم / الكود</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">التصنيف</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">النوع</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">التكلفة</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">سعر البيع</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">المخزون</th>
                                    <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        onClick={() => router.push(`/inventory/products/${product.id}/movements`)}
                                        className="hover:bg-white/5 cursor-pointer transition group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{product.name}</div>
                                            <div className="text-xs text-gray-400 mt-1 flex gap-2">
                                                {product.sku && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-gray-300">SKU: {product.sku}</span>}
                                                {product.barcode && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-gray-300">code: {product.barcode}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {product.category?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'RAW' ? 'bg-amber-500/20 text-amber-300' :
                                                product.type === 'SEMI' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-emerald-500/20 text-emerald-300'
                                                }`}>
                                                {product.type === 'RAW' ? 'خامة' :
                                                    product.type === 'SEMI' ? 'نصف مصنع' : 'منتج تام'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {Number(product.cost_price).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm font-medium">
                                            {inlineEditingId === product.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.selling_price}
                                                    onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                                                    className="w-24 bg-slate-900 border border-blue-500 rounded px-2 py-1 outline-none text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                Number(product.selling_price).toLocaleString()
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inlineEditingId === product.id ? (
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="number"
                                                        value={editForm.stock_quantity}
                                                        onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                                                        className="w-20 bg-slate-900 border border-blue-500 rounded px-2 py-1 outline-none text-white"
                                                    />
                                                    <span className="text-xs text-gray-500">{product.unit}</span>
                                                </div>
                                            ) : (
                                                <div className={`flex items-center gap-2 font-semibold ${product.stock_quantity <= (product.min_stock || 0) ? 'text-red-400' : 'text-green-400'}`}>
                                                    {product.stock_quantity}
                                                    <span className="text-xs font-normal text-gray-500">{product.unit || 'قطعة'}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                {inlineEditingId === product.id ? (
                                                    <button
                                                        onClick={() => saveInlineEdit(product.id)}
                                                        className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-200 rounded-lg transition"
                                                        title="حفظ"
                                                    >
                                                        ✔️
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startInlineEdit(product)}
                                                            className="p-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                            title="تعديل سريع"
                                                        >
                                                            ⚡
                                                        </button>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingProduct(product);
                                                                    setShowModal(true);
                                                                }}
                                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 rounded-lg transition"
                                                                title="تعديل كامل"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition"
                                                                title="حذف"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl mb-2">🔍</span>
                                                <p>لا توجد منتجات تطابق البحث</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            عرض {products.length} من أصل {totalItems} منتج
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm"
                            >
                                السابق
                            </button>
                            <span className="px-4 py-2 text-white font-medium bg-white/10 rounded-lg">
                                {page} / {totalPages || 1}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info Section */}
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">📝 المعلومات الأساسية</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">اسم المنتج <span className="text-red-400">*</span></label>
                                        <input
                                            name="name"
                                            type="text"
                                            defaultValue={editingProduct?.name}
                                            required
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="مثال: شاسيه بلاستيك مقاس 10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">التصنيف</label>
                                        <select
                                            name="category_id"
                                            defaultValue={editingProduct?.category_id}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="">بدون تصنيف</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">نوع المنتج</label>
                                        <select
                                            name="type"
                                            defaultValue={editingProduct?.type || 'FINISHED'}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="RAW">خامة (شراء)</option>
                                            <option value="SEMI">نصف مصنع (إنتاج)</option>
                                            <option value="FINISHED">منتج تام (تجميع)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">وحدة القياس</label>
                                        <input
                                            name="unit"
                                            defaultValue={editingProduct?.unit || 'piece'}
                                            list="units"
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <datalist id="units">
                                            <option value="piece">قطعة</option>
                                            <option value="kg">كيلوجرام</option>
                                            <option value="meter">متر</option>
                                            <option value="box">علبة</option>
                                        </datalist>
                                    </div>
                                </div>
                            </div>

                            {/* Codes & Pricing Section */}
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">💰 التقييم والأكواد</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                                        <input
                                            name="sku"
                                            type="text"
                                            defaultValue={editingProduct?.sku}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Barcode</label>
                                        <input
                                            name="barcode"
                                            type="text"
                                            defaultValue={editingProduct?.barcode}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">تلفة الشراء / الانتاج</label>
                                        <input
                                            name="cost_price"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.cost_price}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">سعر البيع</label>
                                        <input
                                            name="selling_price"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.selling_price}
                                            required
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Inventory & Details Section */}
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">📦 المخزون والوصف</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">حد إعادة الطلب (Min Stock)</label>
                                        <input
                                            name="min_stock"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.min_stock}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">وصف إضافي</label>
                                        <textarea
                                            name="description"
                                            defaultValue={editingProduct?.description}
                                            rows={2}
                                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingProduct(null);
                                    }}
                                    className="px-6 py-2.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition font-medium"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg shadow-blue-900/20"
                                >
                                    {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
