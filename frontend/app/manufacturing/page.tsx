'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface ManufacturingStats {
    activeMachines: number;
    dailyProductionOrders: number;
    usedMoldsCount: number;
}

export default function ManufacturingDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<ManufacturingStats>({
        activeMachines: 0,
        dailyProductionOrders: 0,
        usedMoldsCount: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.getManufacturingStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch manufacturing stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🏭 إدارة التصنيع</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Daily Production */}
                    <div
                        onClick={() => router.push('/manufacturing/daily-production')}
                        className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition duration-300">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">الإنتاج اليومي</h3>
                        <p className="text-gray-400 text-sm">تسجيل إنتاج الماكينات اليومي</p>
                    </div>

                    <div
                        onClick={() => router.push('/manufacturing/raw-materials')}
                        className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition duration-300">
                                <span className="text-2xl">🧱</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">المواد الخام</h3>
                        <p className="text-gray-400 text-sm">إدارة مخزون المواد الخام</p>
                    </div>

                    <div
                        onClick={() => router.push('/manufacturing/fixed-costs')}
                        className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-500/20 rounded-xl group-hover:scale-110 transition duration-300">
                                <span className="text-2xl">💸</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">التكاليف الثابتة</h3>
                        <p className="text-gray-400 text-sm">إيجار، كهرباء، ومصروفات أخرى</p>
                    </div>

                    {/* BOM */}
                    <div
                        onClick={() => router.push('/manufacturing/bom')}
                        className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-lg p-6 rounded-2xl border border-emerald-500/20 hover:bg-white/20 transition cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition duration-300">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">قائمة المكونات BOM</h3>
                        <p className="text-gray-400 text-sm">تفجير المكونات وحساب الأوزان والتكاليف</p>
                    </div>

                    {/* Maintenance System */}
                    <div
                        onClick={() => router.push('/manufacturing/maintenance')}
                        className="bg-gradient-to-br from-red-500/10 to-amber-500/10 backdrop-blur-lg p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-500/20 rounded-xl group-hover:scale-110 transition duration-300">
                                <span className="text-2xl">🛠️</span>
                            </div>
                            <div className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">عاجل</div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">إدارة الصيانة</h3>
                        <p className="text-gray-400 text-sm">متابعة ومواعيد صيانة الماكينات</p>
                        <div className="absolute -right-2 -bottom-2 text-6xl opacity-10 group-hover:scale-125 transition duration-500">⚙️</div>
                    </div>

                    {/* Machines */}
                    <button
                        onClick={() => router.push('/manufacturing/machines')}
                        className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 backdrop-blur-lg p-8 rounded-2xl border border-blue-500/30 flex flex-col items-center gap-4 transition group"
                    >
                        <span className="text-5xl group-hover:scale-110 transition">🏭</span>
                        <h2 className="text-2xl font-bold text-white">إدارة الماكينات</h2>
                        <p className="text-blue-200 text-center">إضافة الماكينات، متابعة الحالة، وسجلات الصيانة</p>
                    </button>

                    {/* Molds */}
                    <button
                        onClick={() => router.push('/manufacturing/molds')}
                        className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 backdrop-blur-lg p-8 rounded-2xl border border-purple-500/30 flex flex-col items-center gap-4 transition group"
                    >
                        <span className="text-5xl group-hover:scale-110 transition">🔧</span>
                        <h2 className="text-2xl font-bold text-white">إدارة الإسطمبات</h2>
                        <p className="text-purple-200 text-center">إدارة الإسطمبات، أوزان المنتجات، وعدد العيون</p>
                    </button>

                    {/* Traceability */}
                    <button
                        onClick={() => router.push('/manufacturing/traceability')}
                        className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 backdrop-blur-lg p-8 rounded-2xl border border-cyan-500/30 flex flex-col items-center gap-4 transition group"
                    >
                        <span className="text-5xl group-hover:scale-110 transition">🔗</span>
                        <h2 className="text-2xl font-bold text-white">تتبع الإنتاج</h2>
                        <p className="text-cyan-200 text-center">تتبع الدفعات، التواريخ، وسلاسل الإمداد</p>
                    </button>
                </div>

                {/* Summary Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">نشاط التصنيع اليوم</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-gray-300 border-b border-white/10 pb-2">
                                <span>الماكينات النشطة (المسجلة)</span>
                                <span className="text-green-400 font-bold">{loading ? '...' : stats.activeMachines}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300 border-b border-white/10 pb-2">
                                <span>عدد سجلات الإنتاج (اليوم)</span>
                                <span className="text-blue-400 font-bold">{loading ? '...' : stats.dailyProductionOrders}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-300 border-b border-white/10 pb-2">
                                <span>الإسطمبات المستخدمة (اليوم)</span>
                                <span className="text-purple-400 font-bold">{loading ? '...' : stats.usedMoldsCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">تنبيهات سريعة</h3>
                        <div className="text-gray-400 text-center py-8">
                            {stats.activeMachines === 0 ? 'لا توجد ماكينات نشطة حالياً' : 'النظام يعمل بشكل مستقر'}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
