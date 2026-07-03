'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';
import { ArrowRight, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';

interface MrpItem {
    id: number;
    name: string;
    unit: string;
    currentStock: number;
    incoming: number;
    required: number;
    netStatus: number;
    status: string;
}

export default function MrpPage() {
    const router = useRouter();
    const [data, setData] = useState<{ report: MrpItem[]; summary: { totalItems: number; shortageCount: number } } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getMRPPlanning()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/manufacturing')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl"><ArrowRight /></button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 /> تخطيط الاحتياجات (MRP)</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {loading ? (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                ) : !data ? (
                    <div className="text-center text-gray-400 py-12">لا توجد بيانات — تأكد من وجود جداول إنتاج معلقة</div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                <div className="text-blue-300 text-sm">إجمالي المواد المطلوبة</div>
                                <div className="text-3xl font-bold text-white">{data.summary?.totalItems ?? 0}</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                                <div className="text-red-300 text-sm">مواد عجز</div>
                                <div className="text-3xl font-bold text-white">{data.summary?.shortageCount ?? 0}</div>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                                <div className="text-green-300 text-sm">مواد متوفرة</div>
                                <div className="text-3xl font-bold text-white">{(data.summary?.totalItems ?? 0) - (data.summary?.shortageCount ?? 0)}</div>
                            </div>
                        </div>

                        {/* MRP Table */}
                        <GlassPanel title="احتياجات المواد">
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="text-right px-4 py-3">المادة</th>
                                            <th className="text-center px-4 py-3">الوحدة</th>
                                            <th className="text-center px-4 py-3">المخزون الحالي</th>
                                            <th className="text-center px-4 py-3">وارد (مشتريات)</th>
                                            <th className="text-center px-4 py-3">المطلوب</th>
                                            <th className="text-center px-4 py-3">صافي الحالة</th>
                                            <th className="text-center px-4 py-3">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.report ?? []).map((item) => (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-400">{item.unit}</td>
                                                <td className="px-4 py-3 text-center text-blue-400">{item.currentStock}</td>
                                                <td className="px-4 py-3 text-center text-amber-400">{item.incoming}</td>
                                                <td className="px-4 py-3 text-center text-orange-400">{item.required}</td>
                                                <td className={`px-4 py-3 text-center font-bold ${item.netStatus < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {item.netStatus}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'OK' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                        {item.status === 'OK' ? <span className="flex items-center gap-1"><CheckCircle /> متوفر</span> : <span className="flex items-center gap-1"><AlertTriangle /> عجز</span>}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.report.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد جداول إنتاج معلقة</td></tr>
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
