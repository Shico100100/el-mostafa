'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = '/api';

interface ProductionRecord {
    id: number;
    date: string;
    machine?: { name: string };
    mold?: { name: string };
    raw_material?: { name: string };
    total_production_kg: number | string;
    pieces_produced: number;
    downtime_minutes?: number;
}

export default function ProductionReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ProductionRecord[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const endpoint = `${API_URL}/manufacturing/production?start_date=${startDate}&end_date=${endDate}`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err: unknown) {
            console.error('Error loading report:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل التقرير');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, router]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟ لن يتم التراجع عن تحديثات المخزون.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/manufacturing/production/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('فشل الحذف');
            }

            // Remove from local state
            setData(data.filter(item => item.id !== id));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'فشل الحذف');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🏭 تقرير الإنتاج</h1>
                    <button
                        onClick={() => router.push('/reports')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للتقارير
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Filters */}
                <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                        />
                    </div>
                    <button
                        onClick={loadReport}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? 'جاري التحميل...' : 'تحديث'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-8 text-red-200">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                )}

                {/* Content */}
                {!loading && data && data.length > 0 && (
                    <div className="bg-white/5 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 text-gray-300">
                                    <tr>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4">الماكينة</th>
                                        <th className="p-4">المنتج (الاسطمبة)</th>
                                        <th className="p-4">الخامة</th>
                                        <th className="p-4">الإنتاج (كجم)</th>
                                        <th className="p-4">القطع المنتجة</th>
                                        <th className="p-4">توقف</th>
                                        <th className="p-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-200">
                                    {data.map((item: ProductionRecord) => (
                                        <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="p-4 whitespace-nowrap">
                                                {new Date(item.date).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="p-4">{item.machine?.name || '-'}</td>
                                            <td className="p-4">{item.mold?.name || '-'}</td>
                                            <td className="p-4">{item.raw_material?.name || '-'}</td>
                                            <td className="p-4 font-bold text-blue-400">
                                                {Number(item.total_production_kg || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 font-bold text-green-400">
                                                {item.pieces_produced || 0}
                                            </td>
                                            <td className="p-4 text-red-300">
                                                {item.downtime_minutes ? `${item.downtime_minutes} دقيقة` : '-'}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition text-sm"
                                                >
                                                    حذف
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && data && data.length === 0 && (
                    <div className="text-center text-gray-400 py-12 bg-white/5 rounded-xl border border-white/10">
                        لا توجد سجلات إنتاج في هذه الفترة
                    </div>
                )}
            </main>
        </div>
    );
}
