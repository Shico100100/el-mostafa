'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';

interface FixedCost {
    id: number;
    month: string;
    category: 'RENT' | 'ELECTRICITY' | 'WATER' | 'WAGES' | 'MAINTENANCE' | 'TRANSPORT' | 'OTHER';
    amount: number;
    notes?: string;
}

export default function FixedCostsPage() {
    const router = useRouter();
    const [costs, setCosts] = useState<FixedCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        month: new Date().toISOString().slice(0, 7), // Default to current month YYYY-MM
        category: 'OTHER',
        amount: '',
        notes: ''
    });

    const fetchCosts = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth(`/manufacturing/fixed-costs?year=${currentYear}`);
            setCosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching fixed costs:', error);
            setCosts([]);
        } finally {
            setLoading(false);
        }
    }, [currentYear]);

    useEffect(() => {
        fetchCosts();
    }, [fetchCosts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.fetchWithAuth('/manufacturing/fixed-costs', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });
            setShowAddDialog(false);
            setFormData({ ...formData, amount: '', notes: '' });
            fetchCosts();
            alert('تمت الإضافة بنجاح ✅');
        } catch (error) {
            console.error('Error adding cost:', error);
            alert('حدث خطأ أثناء الإضافة');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            await api.fetchWithAuth(`/manufacturing/fixed-costs/${id}`, {
                method: 'DELETE'
            });
            fetchCosts();
        } catch (error) {
            console.error('Error deleting cost:', error);
        }
    };

    const totalAmount = costs.reduce((sum, c) => sum + Number(c.amount), 0);

    const getMonthName = (monthStr: string) => {
        const date = new Date(`${monthStr}-01`);
        return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            RENT: 'إيجار 🏢',
            ELECTRICITY: 'كهرباء ⚡',
            WATER: 'مياه 💧',
            WAGES: 'أجور 👷',
            MAINTENANCE: 'صيانة 🛠️',
            TRANSPORT: 'نقل 🚛',
            OTHER: 'أخرى 📦'
        };
        return labels[cat] || cat;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">📉</span>
                        التكاليف الثابتة
                    </h1>
                    <button
                        onClick={() => router.push('/manufacturing')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للتصنيع
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-200 mb-1">إجمالي المصروفات لعام {currentYear}</p>
                            <h2 className="text-4xl font-bold">{totalAmount.toFixed(2)} ج.م</h2>
                        </div>
                        <select
                            value={currentYear}
                            onChange={(e) => setCurrentYear(e.target.value)}
                            className="bg-white/20 border border-white/30 text-black rounded-lg px-4 py-2 focus:outline-none text-xl font-bold"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                <option key={year} value={year} className="text-black">{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">سجل المصروفات السنوي</h3>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
                    >
                        + إضافة مصروف
                    </button>
                </div>

                {/* Costs Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-gray-300">
                            <tr>
                                <th className="px-6 py-4">الشهر</th>
                                <th className="px-6 py-4">البند</th>
                                <th className="px-6 py-4">القيمة</th>
                                <th className="px-6 py-4">ملاحظات</th>
                                <th className="px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-200 divide-y divide-white/10">
                            {costs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد مصروفات مسجلة لهذا العام
                                    </td>
                                </tr>
                            ) : (
                                costs.map((cost) => (
                                    <tr key={cost.id} className="hover:bg-white/5 transition">
                                        <td className="px-6 py-4 text-blue-300">
                                            {getMonthName(cost.month)}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {getCategoryLabel(cost.category)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-400">
                                            {Number(cost.amount).toFixed(2)} ج.م
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{cost.notes || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(cost.id)}
                                                className="text-red-400 hover:text-red-300 transition"
                                                title="حذف"
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

                {/* Add Dialog */}
                {showAddDialog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">إضافة مصروف جديد</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">الشهر</label>
                                    <input
                                        type="month"
                                        required
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">البند</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        {sortAlphabetically([
                                            { value: 'ELECTRICITY', label: 'كهرباء ⚡' },
                                            { value: 'WATER', label: 'مياه 💧' },
                                            { value: 'WAGES', label: 'أجور 👷' },
                                            { value: 'RENT', label: 'إيجار 🏢' },
                                            { value: 'MAINTENANCE', label: 'صيانة 🛠️' },
                                            { value: 'TRANSPORT', label: 'نقل 🚛' },
                                            { value: 'OTHER', label: 'أخرى 📦' }
                                        ], 'label').map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">القيمة (ج.م)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">ملاحظات</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                                        placeholder="تفاصيل إضافية..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
                                    >
                                        حفظ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDialog(false)}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 py-3 rounded-lg font-bold transition"
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
