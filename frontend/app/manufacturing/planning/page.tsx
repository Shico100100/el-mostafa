'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';
import { ArrowRight, CalendarDays, Target } from 'lucide-react';

interface ScheduleItem {
    id: number;
    product?: { name: string };
    machine?: { name: string };
    mold?: { name: string };
    target_quantity: number;
    start_time: string;
    end_time: string;
    status: string;
}

export default function PlanningPage() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const data = await api.getProductionSchedules();
            setSchedules(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const statusColor = (s: string) => {
        switch (s) {
            case 'PENDING': return 'bg-amber-500/20 text-amber-300';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-300';
            case 'COMPLETED': return 'bg-green-500/20 text-green-300';
            case 'CANCELLED': return 'bg-red-500/20 text-red-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };
    const statusText = (s: string) => {
        switch (s) {
            case 'PENDING': return 'معلق';
            case 'IN_PROGRESS': return 'قيد التنفيذ';
            case 'COMPLETED': return 'مكتمل';
            case 'CANCELLED': return 'ملغي';
            default: return s;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/manufacturing')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl"><ArrowRight /></button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarDays /> تخطيط الإنتاج</h1>
                    </div>
                    <button
                        onClick={() => router.push('/manufacturing/schedule')}
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition flex items-center gap-2"
                    >
                        <Target /> جدولة الإنتاج
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {loading ? (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">إجمالي الجداول</div>
                                <div className="text-3xl font-bold text-white">{schedules.length}</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                                <div className="text-amber-300 text-sm">معلق</div>
                                <div className="text-3xl font-bold text-white">{schedules.filter(s => s.status === 'PENDING').length}</div>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                <div className="text-blue-300 text-sm">قيد التنفيذ</div>
                                <div className="text-3xl font-bold text-white">{schedules.filter(s => s.status === 'IN_PROGRESS').length}</div>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                                <div className="text-green-300 text-sm">مكتمل</div>
                                <div className="text-3xl font-bold text-white">{schedules.filter(s => s.status === 'COMPLETED').length}</div>
                            </div>
                        </div>

                        {/* Schedule List */}
                        <GlassPanel title="جداول الإنتاج">
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="text-right px-4 py-3">المنتج</th>
                                            <th className="text-right px-4 py-3">الماكينة</th>
                                            <th className="text-right px-4 py-3">القالب</th>
                                            <th className="text-center px-4 py-3">الكمية</th>
                                            <th className="text-center px-4 py-3">تاريخ البدء</th>
                                            <th className="text-center px-4 py-3">تاريخ الانتهاء</th>
                                            <th className="text-center px-4 py-3">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد جداول إنتاج</td></tr>
                                        ) : (
                                            schedules.map((s) => (
                                                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                    <td className="px-4 py-3 text-white font-medium">{s.product?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-300">{s.machine?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-300">{s.mold?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-center text-amber-400">{s.target_quantity}</td>
                                                    <td className="px-4 py-3 text-center text-gray-400">{s.start_time ? new Date(s.start_time).toLocaleDateString('ar-EG') : '—'}</td>
                                                    <td className="px-4 py-3 text-center text-gray-400">{s.end_time ? new Date(s.end_time).toLocaleDateString('ar-EG') : '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor(s.status)}`}>{statusText(s.status)}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassPanel>
                    </>
                )}
            </main>
        </div>
    );
}
