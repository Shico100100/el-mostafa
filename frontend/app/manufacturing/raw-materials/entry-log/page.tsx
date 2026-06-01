'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Movement {
    id: number;
    date: string;
    product_name: string;
    quantity: number;
    price: number | null;
    notes: string;
}

export default function EntryLogPage() {
    const router = useRouter();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('MONTH'); // DAY, WEEK, MONTH, ALL

    // Edit State
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [editForm, setEditForm] = useState({
        quantity: '',
        price: '',
        date: '',
        notes: ''
    });

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date();
            let query = 'type=IN';

            if (filterPeriod !== 'ALL') {
                const startDate = new Date();
                const endDate = today.toISOString().split('T')[0];

                if (filterPeriod === 'DAY') startDate.setDate(today.getDate() - 1);
                if (filterPeriod === 'WEEK') startDate.setDate(today.getDate() - 7);
                if (filterPeriod === 'MONTH') startDate.setMonth(today.getMonth() - 1);
                if (filterPeriod === 'YEAR') startDate.setFullYear(today.getFullYear() - 1);

                query += `&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate}`;
            }

            const data = await api.fetchWithAuth(`/v1/manufacturing/stock-movements?${query}`);
            setMovements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    }, [filterPeriod]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟ 🗑️\nسيتم عكس تأثيره على المخزون (خصم الكمية)!')) return;

        try {
            await api.fetchWithAuth(`/v1/manufacturing/stock-movements/${id}`, {
                method: 'DELETE',
            });
            alert('تم الحذف بنجاح');
            fetchMovements();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('فشل الحذف');
        }
    };

    const handleEdit = (mov: Movement) => {
        setEditingMovement(mov);
        setEditForm({
            quantity: String(mov.quantity),
            price: mov.price != null ? String(mov.price) : '',
            date: mov.date.split('T')[0],
            notes: mov.notes || ''
        });
        setShowEditDialog(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMovement) return;
        try {
            await api.fetchWithAuth(`/v1/manufacturing/stock-movements/${editingMovement.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    quantity: parseFloat(editForm.quantity),
                    price: parseFloat(editForm.price) || 0,
                    date: editForm.date,
                    notes: editForm.notes
                })
            });
            setShowEditDialog(false);
            setEditingMovement(null);
            fetchMovements();
            alert('تم التحديث بنجاح ✅');
        } catch (error) {
            console.error('Error updating:', error);
            alert('فشل التحديث');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        📝 سجل دخول الخامات (المشتريات)
                    </h1>
                    <button
                        onClick={() => router.push('/manufacturing/raw-materials')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Filters */}
                <div className="mb-6 flex gap-2">
                    {['ALL', 'DAY', 'WEEK', 'MONTH', 'YEAR'].map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterPeriod === p
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {p === 'ALL' ? 'الكل' : p === 'DAY' ? 'يوم' : p === 'WEEK' ? 'أسبوع' : p === 'MONTH' ? 'شهر' : 'سنة'}
                        </button>
                    ))}
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5 text-gray-300 text-sm uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-right">التاريخ</th>
                                <th className="px-6 py-4 text-right">المادة الخام</th>
                                <th className="px-6 py-4 text-right">الكمية</th>
                                <th className="px-6 py-4 text-right">السعر</th>
                                <th className="px-6 py-4 text-right">ملاحظات</th>
                                <th className="px-6 py-4 text-right">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-gray-300">
                            {movements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        لا توجد سجلات
                                    </td>
                                </tr>
                            ) : (
                                movements.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-white/5 transition">
                                        <td className="px-6 py-4">{new Date(mov.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="px-6 py-4 font-bold text-white">{mov.product_name}</td>
                                        <td className="px-6 py-4 font-mono text-green-400">+{mov.quantity}</td>
                                        <td className="px-6 py-4 font-mono text-yellow-400">{mov.price ? mov.price.toFixed(2) : '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{mov.notes}</td>
                                        <td className="px-6 py-4 flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(mov)}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mov.id)}
                                                className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Edit Dialog */}
            {showEditDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
                        <h2 className="text-xl font-bold text-white mb-6">✏️ تعديل سجل دخول</h2>
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
        </div>
    );
}
