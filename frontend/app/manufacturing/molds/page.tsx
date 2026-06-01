'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import ExcelActions from '@/components/ExcelActions';

interface Product {
    id: number;
    name: string;
}

interface Mold {
    id: number;
    name: string;
    product_id?: number;
    product_weight: number;
    cavities: number;
    max_shots?: number;
    current_shots?: number;
    status: string;
    notes?: string;
    life_cycle_status?: string;
    product?: {
        name: string;
    };
}

export default function MoldsPage() {
    const router = useRouter();
    const [molds, setMolds] = useState<Mold[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMoldForIssue, setSelectedMoldForIssue] = useState<Mold | null>(null);
    const [editingMold, setEditingMold] = useState<Mold | null>(null);
    const [showIssueModal, setShowIssueModal] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [productFilter, setProductFilter] = useState('ALL');

    const loadData = useCallback(async () => {
        try {
            const [moldsData, productsData] = await Promise.all([
                api.fetchWithAuth('/manufacturing/molds'),
                api.fetchWithAuth('/inventory/products'),
            ]);
            setMolds(sortAlphabetically(moldsData, 'name'));
            setProducts(sortAlphabetically(productsData, 'name'));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router, loadData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            product_id: formData.get('product_id') || null,
            product_weight: formData.get('product_weight'),
            cavities: formData.get('cavities'),
            max_shots: formData.get('max_shots'),
            status: formData.get('status'),
            notes: formData.get('notes'),
        };

        try {
            if (editingMold) {
                await api.fetchWithAuth(`/manufacturing/molds/${editingMold.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } else {
                await api.fetchWithAuth('/manufacturing/molds', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            }
            setShowModal(false);
            setEditingMold(null);
            loadData();
        } catch (error) {
            console.error('Error saving mold:', error);
            alert('حدث خطأ أثناء حفظ الإسطمبة. تأكد من الاتصال بالخادم.');
        }
    };

    const handleIssueSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = (formData.get('image') as File);
        let imageUrl = '';

        if (file && file.size > 0) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            try {
                const data: { url: string } = await api.fetchWithAuth('/v1/manufacturing/upload', {
                    method: 'POST',
                    body: uploadData,
                });
                imageUrl = data.url;
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        const data = {
            mold_id: selectedMoldForIssue?.id,
            date: new Date().toISOString().split('T')[0],
            description: formData.get('description'),
            status: 'OPEN',
            image_path: imageUrl,
        };

        try {
            await api.fetchWithAuth('/manufacturing/mold-issues', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowIssueModal(false);
            setSelectedMoldForIssue(null);
            alert('تم تسجيل المشكلة بنجاح');
        } catch (error) {
            console.error('Error saving issue:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    const filteredMolds = molds.filter(mold => {
        const matchesSearch = mold.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || mold.status === statusFilter;
        const matchesProduct = productFilter === 'ALL' || mold.product_id?.toString() === productFilter;
        return matchesSearch && matchesStatus && matchesProduct;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'GOOD': return 'bg-green-500/20 text-green-200';
            case 'NEEDS_REPAIR': return 'bg-yellow-500/20 text-yellow-200';
            case 'BROKEN': return 'bg-red-500/20 text-red-200';
            default: return 'bg-gray-500/20 text-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'GOOD': return 'سليمة';
            case 'NEEDS_REPAIR': return 'تحتاج صيانة';
            case 'BROKEN': return 'معطلة';
            case 'MAINTENANCE': return 'تحت الصيانة';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🔧 إدارة الإسطمبات</h1>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => router.push('/manufacturing')}
                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                        >
                            العودة للتصنيع
                        </button>
                        <ExcelActions
                            exportUrl="/manufacturing/export/molds"
                            importUrl="/manufacturing/import/molds"
                            fileName="molds.xlsx"
                            onImportSuccess={loadData}
                        />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <button
                        onClick={() => {
                            setEditingMold(null);
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                    >
                        + إضافة إسطمبة جديدة
                    </button>
                    <div className="flex-1 flex gap-4">
                        <input
                            type="text"
                            placeholder="بحث بالاسم..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-purple-500"
                        >
                            <option value="ALL">كل الحالات</option>
                            <option value="GOOD">سليمة</option>
                            <option value="NEEDS_REPAIR">تحتاج صيانة</option>
                            <option value="BROKEN">معطلة</option>
                            <option value="MAINTENANCE">تحت الصيانة</option>
                        </select>
                        <select
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-purple-500"
                        >
                            <option value="ALL">كل المنتجات</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id.toString()}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMolds.map((mold) => (
                        <div key={mold.id} className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-3">{mold.name}</h3>
                            <div className="space-y-2 mb-4">
                                <p className="text-gray-300 text-sm">المنتج: {mold.product?.name || 'غير محدد'}</p>
                                <p className="text-gray-300 text-sm">الوزن: {mold.product_weight} جرام</p>
                                <p className="text-gray-300 text-sm">عدد العيون: {mold.cavities}</p>
                                <div className="mt-2 text-xs">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">العمر الافتراضي ({mold.current_shots || 0})</span>
                                        <span className={mold.life_cycle_status === 'critical' ? 'text-red-400' : mold.life_cycle_status === 'warning' ? 'text-amber-400' : 'text-green-400'}>
                                            {(((mold.current_shots ?? 0) / (mold.max_shots || 1)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${mold.life_cycle_status === 'critical' ? 'bg-red-500' : mold.life_cycle_status === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(((mold.current_shots || 0) / (mold.max_shots || 1000000)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(mold.status)}`}>
                                    {getStatusText(mold.status)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/manufacturing/molds/${mold.id}`)}
                                    className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded"
                                >
                                    السجل
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingMold(mold);
                                        setShowModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded"
                                >
                                    تعديل
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedMoldForIssue(mold);
                                        setShowIssueModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded"
                                >
                                    مشكلة
                                </button>
                            </div>
                        </div>
                    ))}
                    {molds.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-12">
                            لا توجد إسطمبات. قم بإضافة إسطمبة جديدة.
                        </div>
                    )}
                </div>
            </main>

            {/* Mold Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingMold ? 'تعديل إسطمبة' : 'إضافة إسطمبة جديدة'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* ... form fields ... */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">اسم الإسطمبة</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingMold?.name}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">المنتج (اختياري)</label>
                                <select
                                    name="product_id"
                                    defaultValue={editingMold?.product_id}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="">اختر المنتج (اختياري)</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">يمكنك ربط الإسطمبة بمنتج نهائي إذا وجد</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">وزن المنتج (جرام)</label>
                                <input
                                    name="product_weight"
                                    type="number"
                                    step="0.001"
                                    defaultValue={editingMold?.product_weight}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <input
                                    name="cavities"
                                    type="number"
                                    defaultValue={editingMold?.cavities}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">العمر الافتراضي (عدد الضربات)</label>
                                <input
                                    name="max_shots"
                                    type="number"
                                    defaultValue={editingMold?.max_shots || 1000000}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الحالة</label>
                                <select
                                    name="status"
                                    defaultValue={editingMold?.status || 'GOOD'}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="GOOD">سليمة</option>
                                    <option value="NEEDS_REPAIR">تحتاج صيانة</option>
                                    <option value="MAINTENANCE">تحت الصيانة</option>
                                    <option value="BROKEN">معطلة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
                                <textarea
                                    name="notes"
                                    defaultValue={editingMold?.notes}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingMold(null);
                                    }}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                                >
                                    {editingMold ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowIssueModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تسجيل مشكلة في الإسطمبة</h2>
                        <form onSubmit={handleIssueSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">وصف المشكلة</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    placeholder="اشرح المشكلة بالتفصيل..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">صورة المشكلة (اختياري)</label>
                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowIssueModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700"
                                >
                                    تسجيل المشكلة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
