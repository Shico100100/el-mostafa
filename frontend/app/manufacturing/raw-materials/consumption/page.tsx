'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Consumption {
    id: number;
    raw_material: {
        id: number;
        product: {
            name: string;
            unit: string;
        };
    };
    quantity: number;
    cost_per_unit: number;
    total_cost: number;
    consumed_at: string;
    assembly_order?: {
        id: number;
    };
    production?: {
        id: number;
    };
    notes?: string;
}

export default function ConsumptionHistoryPage() {
    const router = useRouter();
    const [consumptions, setConsumptions] = useState<Consumption[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchConsumptions = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            const queryString = params.toString();
            const endpoint = `/v1/manufacturing/raw-materials/consumption/history${queryString ? `?${queryString}` : ''}`;
            const data = await api.fetchWithAuth(endpoint);
            setConsumptions(data);
        } catch (error) {
            console.error('Error fetching consumptions:', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchConsumptions();
    }, [fetchConsumptions]);

    const stats = {
        totalConsumptions: consumptions.length,
        totalCost: consumptions.reduce((sum, c) => sum + Number(c.total_cost), 0),
        totalQuantity: consumptions.reduce((sum, c) => sum + Number(c.quantity), 0),
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
                        <span className="text-3xl">📊</span>
                        سجل استهلاك المواد الخام
                    </h1>
                    <button
                        onClick={() => router.push('/manufacturing/raw-materials')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للمواد الخام
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">إجمالي السجلات</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats.totalConsumptions}</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <span className="text-3xl">📋</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">إجمالي التكلفة</p>
                                <p className="text-2xl font-bold text-green-400 mt-1">
                                    {stats.totalCost.toFixed(2)} ج.م
                                </p>
                            </div>
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <span className="text-3xl">💰</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">إجمالي الكمية</p>
                                <p className="text-3xl font-bold text-purple-400 mt-1">
                                    {stats.totalQuantity.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <span className="text-3xl">📦</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-6">
                    <h3 className="text-white font-semibold mb-4">🔍 تصفية النتائج</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 text-sm mb-2">من تاريخ</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm mb-2">إلى تاريخ</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchConsumptions}
                                className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition"
                            >
                                بحث
                            </button>
                        </div>
                    </div>
                </div>

                {/* Consumption Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">المادة الخام</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">الكمية</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">سعر الوحدة</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">التكلفة الإجمالية</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">المرجع</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {consumptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            لا توجد سجلات استهلاك
                                        </td>
                                    </tr>
                                ) : (
                                    consumptions.map((consumption) => (
                                        <tr key={consumption.id} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300">
                                                    {new Date(consumption.consumed_at).toLocaleDateString('ar-EG')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(consumption.consumed_at).toLocaleTimeString('ar-EG')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">
                                                    {consumption.raw_material.product.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-semibold">
                                                    {Number(consumption.quantity).toFixed(2)}{' '}
                                                    {consumption.raw_material.product.unit}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300">
                                                    {Number(consumption.cost_per_unit).toFixed(2)} ج.م
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-green-400 font-semibold">
                                                    {Number(consumption.total_cost).toFixed(2)} ج.م
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300">
                                                    {consumption.assembly_order
                                                        ? `تجميع #${consumption.assembly_order.id}`
                                                        : consumption.production
                                                            ? `إنتاج #${consumption.production.id}`
                                                            : 'يدوي'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-400 text-sm">
                                                    {consumption.notes || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
