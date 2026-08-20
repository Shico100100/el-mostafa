'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { toast } from 'sonner';
import { confirmDialog } from '../../../../lib/confirm-dialog';
import { FileText, BarChart3, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface RawMaterial {
    id: number;
    current_stock: number;
    last_purchase_price?: number;
    reorder_point: number;
    stock_status: string;
    product: {
        id: number;
        name: string;
        unit: string;
        cost_price: number;
    };
}

interface StockMovement {
    id: number;
    date: string;
    type: string;
    quantity: number;
    price?: number;
    reference?: string;
    notes?: string;
}

export default function RawMaterialDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [rawMaterial, setRawMaterial] = useState<RawMaterial | null>(null);
    const [movements, setMovements] = useState<StockMovement[]>([]);

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
    const [editForm, setEditForm] = useState({
        quantity: '',
        price: '',
        date: '',
        notes: ''
    });

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addForm, setAddForm] = useState({
        type: 'IN',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    const [filterPeriod, setFilterPeriod] = useState('ALL');
    const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);

    const filterData = useCallback(() => {
        if (filterPeriod === 'ALL') {
            setFilteredMovements(movements);
            return;
        }

        const now = new Date();
        const startDate = new Date();

        switch (filterPeriod) {
            case 'DAY': startDate.setDate(now.getDate() - 1); break;
            case 'MONTH': startDate.setMonth(now.getMonth() - 1); break;
            case '3MONTHS': startDate.setMonth(now.getMonth() - 3); break;
            case '6MONTHS': startDate.setMonth(now.getMonth() - 6); break;
            case 'YEAR': startDate.setFullYear(now.getFullYear() - 1); break;
        }

        const filtered = movements.filter(m => new Date(m.date) >= startDate);
        setFilteredMovements(filtered);
    }, [movements, filterPeriod]);

    const fetchData = useCallback(async () => {
        try {
            const raw = await api.getRawMaterial(+id);
            const movementsData = await api.getRawMaterialMovements(+id);
            setRawMaterial(raw);
            setMovements(movementsData);
        } catch (error: unknown) {
            console.error('Error fetching details:', error);
            if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                setRawMaterial(null);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        filterData();
    }, [filterData]);

    const handleDeleteMovement = async (movId: number) => {
        confirmDialog({
            message: 'هل أنت متأكد من حذف هذا السجل؟',
            description: 'سيتم عكس تأثيره على المخزون!',
            confirmLabel: 'حذف',
            danger: true,
            onConfirm: async () => {
                try {
                    await api.deleteStockMovement(movId);
                    toast.success('تم الحذف بنجاح');
                    fetchData();
                } catch (error) {
                    console.error('Error deleting movement:', error);
                    toast.error('حدث خطأ');
                }
            },
        });
    };

    const handleEditMovement = (mov: StockMovement) => {
        setEditingMovement(mov);
        setEditForm({
            quantity: String(mov.quantity),
            price: String(mov.price ?? ''),
            date: mov.date?.split('T')[0] ?? '',
            notes: mov.notes || ''
        });
        setShowEditDialog(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMovement) return;

        try {
            await api.updateStockMovement(editingMovement.id, {
                quantity: parseFloat(editForm.quantity),
                price: parseFloat(editForm.price) || 0,
                date: editForm.date,
                notes: editForm.notes
            });
            setShowEditDialog(false);
            setEditingMovement(null);
            fetchData();
            toast.success('تم تحديث السجل بنجاح');
        } catch (error) {
            console.error('Error updating movement:', error);
            toast.error('حدث خطأ أثناء التحديث');
        }
    };

    const handleAddMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (addForm.type === 'IN') {
                await api.addRawMaterialStock(+id, {
                    quantity: parseFloat(addForm.quantity),
                    price: parseFloat(addForm.price) || undefined,
                    date: addForm.date,
                    notes: addForm.notes
                });
            } else {
                await api.createStockMovement({
                    productId: +id,
                    type: addForm.type as 'IN' | 'OUT',
                    quantity: parseFloat(addForm.quantity),
                    price: parseFloat(addForm.price) || 0,
                    date: addForm.date,
                    reference: addForm.reference,
                    notes: addForm.notes
                });
            }
            setShowAddDialog(false);
            setAddForm({
                type: 'IN',
                quantity: '',
                price: '',
                date: new Date().toISOString().split('T')[0],
                reference: '',
                notes: ''
            });
            fetchData();
            toast.success('تم إضافة الحركة بنجاح');
        } catch (error) {
            console.error('Error adding movement:', error);
            toast.error('حدث خطأ أثناء الإضافة');
        }
    };

    if (loading) return <div className="text-white text-center p-10">جاري التحميل...</div>;
    if (!rawMaterial) return <div className="text-white text-center p-10">المادة الخام غير موجودة</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl"><FileText /></span>
                        تفاصيل: {rawMaterial.product.name}
                    </h1>
                    <button
                        onClick={() => router.push('/manufacturing/raw-materials')}
                        className="px-4 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg transition"
                    >
                        عودة للقائمة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                        <div className="relative group">
                            <p className="text-gray-400 text-sm">المخزون الحالي</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <p className="text-3xl font-bold text-white">
                                    {rawMaterial.current_stock} <span className="text-sm font-normal">{rawMaterial.product.unit}</span>
                                </p>
                                <button
                                    onClick={() => {
                                        confirmDialog({
                                            message: 'هل تريد إعادة حساب المخزون بناءً على سجل الحركات؟',
                                            description: 'سيتم تعديل الرقم الحالي ليطابق مجموع العمليات المسجلة.',
                                            onConfirm: async () => {
                                                try {
                                                    const data = await api.recalculateRawMaterialStock(+id);
                                                    toast.success(`تم التحديث بنجاح - الرصيد المحسوب: ${data.calculated_stock}`);
                                                    fetchData();
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error('حدث خطأ');
                                                }
                                            },
                                        });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition p-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-blue-300 rounded text-xs"
                                    title="إعادة احتساب الرصيد من السجل"
                                >
                                    <RefreshCw /> تصحيح
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">آخر سعر شراء</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">
                                {Number(rawMaterial.last_purchase_price ?? rawMaterial.product?.cost_price ?? 0).toFixed(2)} ج.م
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">الحد الأدنى</p>
                            <p className="text-2xl font-bold text-yellow-400 mt-1">
                                {rawMaterial.reorder_point}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">الحالة</p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold 
                                ${rawMaterial.stock_status === 'NORMAL' ? 'bg-green-500/20 text-green-400' :
                                    rawMaterial.stock_status === 'LOW_STOCK' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                {rawMaterial.stock_status === 'NORMAL' ? 'عادي' : rawMaterial.stock_status === 'LOW_STOCK' ? 'منخفض' : 'نفذ'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 /> سجل الحركة اليومي</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1 overflow-x-auto">
                                {[
                                    { label: 'الكل', value: 'ALL' },
                                    { label: 'يوم', value: 'DAY' },
                                    { label: 'شهر', value: 'MONTH' },
                                    { label: '3 شهور', value: '3MONTHS' },
                                    { label: '6 شهور', value: '6MONTHS' },
                                    { label: 'سنة', value: 'YEAR' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterPeriod(opt.value)}
                                        className={`px-3 py-1.5 rounded-md text-sm transition ${filterPeriod === opt.value
                                            ? 'bg-blue-600/80 text-white font-bold'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowAddDialog(true)}
                                className="px-3 py-1.5 bg-green-600/80 text-white rounded-md text-sm hover:bg-green-700"
                            >
                                <Plus /> إضافة حركة
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">النوع</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الكمية</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">السعر</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">المورد / المرجع</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">ملاحظات</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">الرصيد بعد الحركة</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">تعديل</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">حذف</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                            لا توجد حركات مسجلة
                                        </td>
                                    </tr>
                                ) : (() => {
                                    const sorted = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                    let netChange = 0;
                                    sorted.forEach(m => {
                                        const qty = Number(m.quantity);
                                        if (m.type === 'IN') netChange += qty;
                                        else netChange -= qty;
                                    });
                                    const currentStock = Number(rawMaterial.current_stock || 0);
                                    const balanceMap = new Map<number, number>();
                                    let balance = currentStock - netChange;
                                    sorted.forEach(m => {
                                        const qty = Number(m.quantity);
                                        if (m.type === 'IN') balance += qty;
                                        else balance -= qty;
                                        balanceMap.set(m.id, balance);
                                    });
                                    return filteredMovements.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4 text-gray-300">
                                                {mov.date ? new Date(mov.date).toLocaleDateString('ar-EG') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${mov.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {mov.type === 'IN' ? 'شراء / إضافة' : 'استهلاك / صرف'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-mono">{mov.quantity}</td>
                                            <td className="px-6 py-4 text-gray-300">{mov.price ? `${Number(mov.price).toFixed(2)} ج.م` : '-'}</td>
                                            <td className="px-6 py-4 text-gray-300">{mov.reference}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{mov.notes || '-'}</td>
                                            <td className={`px-6 py-4 text-center font-bold text-sm ${(balanceMap.get(mov.id) ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                {(balanceMap.get(mov.id) ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditMovement(mov)}
                                                    className="p-1 px-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded text-sm transition"
                                                >
                                                    <Pencil />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMovement(mov.id)}
                                                    className="p-1 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-sm transition"
                                                >
                                                    <Trash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showEditDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Pencil /> تعديل السجل</h2>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">الكمية</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        dir="ltr"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right"
                                    />
                                </div>
                                {editingMovement?.type === 'IN' && (
                                    <div>
                                        <label className="block text-gray-300 text-sm font-semibold mb-2">السعر</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            dir="ltr"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">ملاحظات</label>
                                    <textarea
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                                    >
                                        حفظ التعديلات
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditDialog(false)}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAddDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus /> إضافة حركة</h2>
                            <form onSubmit={handleAddMovement} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">النوع</label>
                                    <select
                                        value={addForm.type}
                                        onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                    >
                                        <option value="IN">شراء / إضافة</option>
                                        <option value="OUT">استهلاك / صرف</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={addForm.date}
                                        onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">الكمية</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        dir="ltr"
                                        value={addForm.quantity}
                                        onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right"
                                    />
                                </div>
                                {addForm.type === 'IN' && (
                                    <div>
                                        <label className="block text-gray-300 text-sm font-semibold mb-2">السعر</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            dir="ltr"
                                            value={addForm.price}
                                            onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">المورد / المرجع</label>
                                    <input
                                        type="text"
                                        value={addForm.reference}
                                        onChange={(e) => setAddForm({ ...addForm, reference: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">ملاحظات</label>
                                    <textarea
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                                    >
                                        إضافة الحركة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDialog(false)}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
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
