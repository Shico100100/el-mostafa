'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';

interface BOM {
    id: number;
    name: string;
    product?: {
        name: string;
    };
}

interface AssemblyOrder {
    id: number;
    date: string;
    quantity_produced: number;
    total_cost: number;
    bom?: {
        product?: {
            name: string;
        };
    };
}

export default function AssemblyPage() {
    const router = useRouter();
    const [boms, setBoms] = useState<BOM[]>([]);
    const [orders, setOrders] = useState<AssemblyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [selectedBom, setSelectedBom] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const loadData = useCallback(async () => {
        try {
            const [bomsData, ordersData] = await Promise.all([
                api.fetchWithAuth('/manufacturing/boms'),
                api.fetchWithAuth('/manufacturing/assembly'),
            ]);
            setBoms(sortAlphabetically(bomsData, 'name'));
            setOrders(ordersData);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('هل أنت متأكد من تنفيذ أمر التجميع؟ سيتم خصم المكونات من المخزن.')) return;

        const data = {
            bom_id: Number(selectedBom),
            quantity: Number(quantity),
            date,
        };

        try {
            await api.fetchWithAuth('/manufacturing/assembly', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowModal(false);
            setQuantity('');
            setSelectedBom('');
            loadData();
            alert('تم تنفيذ أمر التجميع بنجاح وتم تحديث المخزون');
        } catch (error: unknown) {
            console.error('Error saving assembly:', error);
            const message = error instanceof Error ? error.message : 'تأكد من توفر رصيد كافي من الخامات';
            alert('حدث خطأ: ' + message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">⚙️ أوامر التجميع والإنتاج</h1>
                    <button
                        onClick={() => router.push('/manufacturing')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للتصنيع
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition"
                    >
                        + أمر تجميع جديد
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">المنتج</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الكمية المنتجة</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">التكلفة الإجمالية</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-300">{new Date(order.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 text-gray-200 font-semibold">{order.bom?.product?.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{order.quantity_produced}</td>
                                    <td className="px-6 py-4 text-gray-300">{Number(order.total_cost).toFixed(2)} جنيه</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded text-sm">
                                            مكتمل
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد أوامر تجميع سابقة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تنفيذ أمر تجميع</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">المنتج (المعادلة)</label>
                                <select
                                    value={selectedBom}
                                    onChange={(e) => setSelectedBom(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="">اختر المنتج المراد تجميعه</option>
                                    {boms.map((bom) => (
                                        <option key={bom.id} value={bom.id}>{bom.name} ({bom.product?.name})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الكمية المراد إنتاجها</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                    min="1"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <p className="text-sm text-yellow-200">
                                    ⚠️ تنبيه: سيتم خصم الخامات المطلوبة تلقائياً من المخزن وإضافة المنتج النهائي.
                                </p>
                            </div>

                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700"
                                >
                                    تنفيذ الأمر
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
