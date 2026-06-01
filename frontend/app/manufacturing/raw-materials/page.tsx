'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ExcelActions from '@/components/ExcelActions';

interface RawMaterial {
    id: number;
    product: {
        id: number;
        name: string;
        sku: string;
        unit: string;
        cost_price: number;
    };
    preferred_supplier?: {
        id: number;
        name: string;
    };
    reorder_point: number;
    reorder_quantity: number;
    last_purchase_price?: number;
    current_stock: number;
    stock_status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    notes?: string;
}

export default function RawMaterialsPage() {
    const router = useRouter();
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        reorder_point: '',
    });

    const fetchRawMaterials = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth('/manufacturing/raw-materials');
            setRawMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching raw materials:', error);
            setRawMaterials([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRawMaterials();
    }, [fetchRawMaterials]);

    // ... (fetch functions remain same)

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMaterials = [...rawMaterials].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: string | number = 0;
        let bValue: string | number = 0;

        // Custom getters for nested properties
        if (sortConfig.key === 'name') {
            aValue = a.product.name;
            bValue = b.product.name;
        } else if (sortConfig.key === 'current_stock') {
            aValue = Number(a.current_stock);
            bValue = Number(b.current_stock);
        } else if (sortConfig.key === 'reorder_point') {
            aValue = Number(a.reorder_point);
            bValue = Number(b.reorder_point);
        } else if (sortConfig.key === 'cost_price') {
            aValue = Number(a.last_purchase_price || 0);
            bValue = Number(b.last_purchase_price || 0);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-gray-600">⇅</span>;
        return sortConfig.direction === 'asc' ? <span className="text-blue-400">↑</span> : <span className="text-blue-400">↓</span>;
    };


    const handleDelete = async (id: number) => {
        try {
            await api.fetchWithAuth(`/manufacturing/raw-materials/${id}`, {
                method: 'DELETE',
            });
            alert('تم الحذف بنجاح ✅');
            fetchRawMaterials();
        } catch (error) {
            console.error('Error deleting raw material:', error);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const handleEdit = (rm: RawMaterial) => {
        setEditingId(rm.id);
        setIsEditing(true);
        setFormData({
            name: rm.product.name,
            unit: rm.product.unit,
            reorder_point: rm.reorder_point.toString(),
        });
        setShowAddDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingId) {
                const currentRM = rawMaterials.find(rm => rm.id === editingId);
                if (!currentRM) return;

                await api.fetchWithAuth(`/inventory/products/${currentRM.product.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: formData.name,
                        unit: formData.unit,
                    }),
                });

                await api.fetchWithAuth(`/manufacturing/raw-materials/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        reorder_point: parseFloat(formData.reorder_point) || 0,
                    }),
                });

                setShowAddDialog(false);
                resetForm();
                fetchRawMaterials();
                alert('تم التعديل بنجاح ✅');

            } else {
                const product = await api.fetchWithAuth('/inventory/products', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: formData.name,
                        sku: null,
                        unit: formData.unit,
                        cost_price: 0,
                        selling_price: 0,
                        type: 'RAW',
                        description: null,
                    }),
                });

                await api.fetchWithAuth('/manufacturing/raw-materials', {
                    method: 'POST',
                    body: JSON.stringify({
                        product_id: product.id,
                        reorder_point: parseFloat(formData.reorder_point) || 0,
                        reorder_quantity: 0,
                        preferred_supplier_id: null,
                        notes: null,
                    }),
                });

                setShowAddDialog(false);
                resetForm();
                fetchRawMaterials();
            }
        } catch (error) {
            console.error('Error creating/updating raw material:', error);
            alert('حدث خطأ أثناء العملية');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            unit: 'kg',
            reorder_point: '',
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'NORMAL':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'LOW_STOCK':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'OUT_OF_STOCK':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStockStatusText = (status: string) => {
        switch (status) {
            case 'NORMAL':
                return 'عادي';
            case 'LOW_STOCK':
                return 'منخفض';
            case 'OUT_OF_STOCK':
                return 'نفذ';
            default:
                return status;
        }
    };

    // Calculate statistics
    const stats = {
        total: rawMaterials.length,
        lowStock: rawMaterials.filter((rm) => rm.stock_status === 'LOW_STOCK').length,
        outOfStock: rawMaterials.filter((rm) => rm.stock_status === 'OUT_OF_STOCK').length,
        totalValue: rawMaterials.reduce(
            (sum, rm) => sum + (rm.current_stock * (rm.last_purchase_price || rm.product.cost_price)),
            0
        ),
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">📦</span>
                        إدارة المواد الخام
                    </h1>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => router.push('/manufacturing')}
                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                        >
                            العودة للتصنيع
                        </button>
                        <ExcelActions
                            exportUrl="/manufacturing/export/raw-materials"
                            importUrl="/manufacturing/import/raw-materials"
                            fileName="raw_materials.xlsx"
                            onImportSuccess={fetchRawMaterials}
                        />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">إجمالي المواد</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <span className="text-3xl">📦</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">مخزون منخفض</p>
                                <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.lowStock}</p>
                            </div>
                            <div className="p-3 bg-yellow-500/20 rounded-xl">
                                <span className="text-3xl">⚠️</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">نفذ المخزون</p>
                                <p className="text-3xl font-bold text-red-400 mt-1">{stats.outOfStock}</p>
                            </div>
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <span className="text-3xl">🚨</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">قيمة المخزون</p>
                                <p className="text-2xl font-bold text-green-400 mt-1">
                                    {stats.totalValue.toFixed(2)} ج.م
                                </p>
                            </div>
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <span className="text-3xl">💰</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => router.push('/manufacturing/raw-materials/entry-log')} // Create this page next
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold transition"
                    >
                        📝 سجل دخول الخامات
                    </button>
                    <button
                        onClick={() => router.push('/manufacturing/raw-materials/consumption')}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-semibold transition"
                    >
                        📉 سجل الاستهلاك
                    </button>
                    <button
                        onClick={() => {
                            setFormData({ name: '', unit: 'kg', reorder_point: '' });
                            setIsEditing(false);
                            setEditingId(null);
                            setShowAddDialog(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
                    >
                        + مادة خام جديدة
                    </button>
                </div>

                {/* Raw Materials Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 text-gray-300 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-2">
                                            اسم المادة الخام {getSortIndicator('name')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => handleSort('current_stock')}>
                                        <div className="flex items-center gap-2">
                                            المخزون الحالي {getSortIndicator('current_stock')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right">الوحدة</th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => handleSort('reorder_point')}>
                                        <div className="flex items-center gap-2">
                                            الحد الأدنى {getSortIndicator('reorder_point')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => handleSort('cost_price')}>
                                        <div className="flex items-center gap-2">
                                            آخر سعر شراء {getSortIndicator('cost_price')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right">الحالة</th>
                                    <th className="px-6 py-4 text-right">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-gray-300">
                                {sortedMaterials.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                            لا توجد مواد خام مسجلة
                                        </td>
                                    </tr>
                                ) : (
                                    sortedMaterials.map((rm) => (
                                        <tr
                                            key={rm.id}
                                            className="hover:bg-white/5 transition cursor-pointer"
                                            onClick={() => router.push(`/manufacturing/raw-materials/${rm.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{rm.product.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-semibold">
                                                    {rm.current_stock} {rm.product.unit}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300">{rm.reorder_point} {rm.product.unit}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStockStatusColor(
                                                        rm.stock_status
                                                    )}`}
                                                >
                                                    {getStockStatusText(rm.stock_status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-green-400 font-semibold">
                                                    {Number(rm.last_purchase_price || rm.product.cost_price).toFixed(2)} ج.م
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/manufacturing/raw-materials/${rm.id}`);
                                                    }}
                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition"
                                                    title="التفاصيل"
                                                >
                                                    📄
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(rm);
                                                    }}
                                                    className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition"
                                                    title="تعديل"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('هل أنت متأكد من حذف هذه المادة الخام؟ 🗑️\nسيتم حذف جميع السجلات المرتبطة بها!')) {
                                                            handleDelete(rm.id);
                                                        }
                                                    }}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition"
                                                    title="حذف"
                                                >
                                                    🗑️
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/manufacturing/raw-materials/${rm.id}/add-stock`);
                                                    }}
                                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition"
                                                    title="إضافة رصيد"
                                                >
                                                    ➕
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Raw Material Dialog */}
                {showAddDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
                        <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/20">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {isEditing ? '✏️ تعديل المادة الخام' : '➕ إضافة مادة خام جديدة'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        اسم المادة الخام *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        placeholder="مثال: بلاستيك PP"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        الوحدة *
                                    </label>
                                    <select
                                        required
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="kg">كيلوجرام (kg)</option>
                                        <option value="ton">طن (ton)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        الحد الأدنى للطلب (Reorder Point) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.reorder_point}
                                        onChange={(e) =>
                                            setFormData({ ...formData, reorder_point: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        placeholder="مثال: 100"
                                    />
                                </div>



                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                                    >
                                        {isEditing ? 'حفظ التعديلات' : 'إضافة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddDialog(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg font-semibold transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
