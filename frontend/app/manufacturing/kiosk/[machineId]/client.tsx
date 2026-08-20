'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Home, AlertTriangle, Save, Thermometer, Wrench, Zap, FileText } from 'lucide-react';

interface Machine {
    id: number;
    name: string;
}

interface Mold {
    id: number;
    name: string;
    cavities: number;
    product_weight: number;
}

export default function MachineKioskPage({ machineId }: { machineId: string }) {

    const router = useRouter();
    const [machine, setMachine] = useState<Machine | null>(null);
    const [loading, setLoading] = useState(true);
    const [cycleCount, setCycleCount] = useState(0);
    const [mold, setMold] = useState<Mold | null>(null);

    const loadMachineData = useCallback(async () => {
        try {
            const [machineData, lastProd] = await Promise.all([
                api.fetchWithAuth(`/manufacturing/machines/${machineId}`),
                api.fetchWithAuth(`/manufacturing/machines/${machineId}/last-mold`)
            ]);
            setMachine(machineData);
            if (lastProd) {
                setMold(lastProd.mold);
            }
        } catch (error) {
            console.error('Error loading machine data:', error);
        } finally {
            setLoading(false);
        }
    }, [machineId]);

    useEffect(() => {
        loadMachineData();
    }, [loadMachineData]);

    const handleProductionSubmit = async () => {
        if (!mold) {
            toast.error('الرجاء اختيار القالب أولاً (من لوحة الإدارة)');
            return;
        }

        try {
            await api.createProduction({
                machine_id: Number(machineId),
                mold_id: mold.id,
                pieces_produced: cycleCount * (mold.cavities || 1),
                date: new Date().toISOString(),
                shift: 'A',
                operator_name: 'عامل الكشك',
                notes: 'تسجيل من الكشك الذكي'
            });

            const btn = document.getElementById('produce-btn');
            if (btn) {
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = 'scale(1)', 100);
            }

            toast.success(`تم تسجيل ${cycleCount} دورة (${cycleCount * (mold.cavities || 1)} قطعة) بنجاح!`);
            setCycleCount(0);
            router.refresh();
        } catch (error) {
            console.error('Production error:', error);
            toast.error('خطأ في التسجيل');
        }
    };

    if (loading || !machine) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-4xl animate-pulse">جاري فتح النظام...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col" dir="rtl">
            <div className="bg-slate-900 border-b border-white/10 p-6 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/manufacturing/kiosk')}
                        className="w-16 h-16 bg-slate-800 rounded-2xl text-3xl flex items-center justify-center border border-white/20 hover:bg-slate-700 transition"
                    >
                        <Home />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white">{machine.name}</h1>
                        <p className="text-xl text-emerald-400 mt-1">
                            {mold ? `القالب الحالي: ${mold.name}` : <span className="flex items-center gap-1"><AlertTriangle /> لا يوجد قالب محدد</span>}
                        </p>
                    </div>
                </div>
                <div className="text-left">
                    <div className="text-2xl font-mono dir-ltr text-blue-300">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-slate-400">
                        {new Date().toLocaleDateString('ar-EG')}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-8 flex flex-col justify-center items-center">
                    <div className="text-slate-400 text-2xl mb-4">عدد الدورات (الضربات)</div>
                    <div className="flex items-center gap-8 mb-12">
                        <button
                            onClick={() => setCycleCount(Math.max(0, cycleCount - 1))}
                            className="w-24 h-24 bg-rose-500/20 hover:bg-rose-500/30 border-2 border-rose-500/50 rounded-full text-4xl text-rose-500 transition"
                        >
                            -
                        </button>
                        <div className="text-9xl font-mono font-bold w-48 text-center">
                            {cycleCount}
                        </div>
                        <button
                            onClick={() => setCycleCount(cycleCount + 1)}
                            className="w-24 h-24 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/50 rounded-full text-4xl text-emerald-500 transition"
                        >
                            +
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6 w-full mb-12">
                        {[1, 5, 10, 50, 100].map(num => (
                            <button
                                key={num}
                                onClick={() => setCycleCount(cycleCount + num)}
                                className="py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xl font-bold border border-white/10 transition"
                            >
                                +{num}
                            </button>
                        ))}
                        <button
                            onClick={() => setCycleCount(0)}
                            className="py-4 bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 rounded-xl text-xl font-bold border border-rose-500/20 transition"
                        >
                            تصفير
                        </button>
                    </div>

                    <button
                        id="produce-btn"
                        onClick={handleProductionSubmit}
                        disabled={cycleCount === 0}
                        className={`
                            w-full py-8 rounded-3xl text-4xl font-black shadow-2xl transition-all duration-200
                            ${cycleCount > 0
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] shadow-blue-900/50 text-white cursor-pointer'
                                : 'bg-slate-800 text-[#ecfdf5]0 cursor-not-allowed'
                            }
                        `}
                    >
                        <Save /> تسجيل الإنتاج
                    </button>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-8">
                        <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">إحصائيات فورية</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xl text-slate-400">المنتج المتوقع</span>
                                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                    {(cycleCount * (mold?.cavities || 1)).toLocaleString()} قطعة
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xl text-slate-400">الوزن المقدر</span>
                                <span className="text-2xl font-bold text-white">
                                    {((cycleCount * (mold?.cavities || 1) * (mold?.product_weight || 0)) / 1000).toFixed(2)} كجم
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-8">
                        <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 text-rose-400 flex items-center gap-2"><AlertTriangle /> تنبيه عطل</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={async () => {
                                    try {
                                        await api.fetchWithAuth('/manufacturing/maintenance', {
                                            method: 'POST',
                                            body: JSON.stringify({ machine_id: Number(machineId), type: 'HIGH_TEMP', date: new Date().toISOString(), description: 'حرارة عالية', cost: 0, status: 'OPEN', notes: 'تم الإبلاغ من الكشك الذكي' }),
                                        });
                                         toast.success('تم تسجيل بلاغ حرارة عالية');
                                     } catch { toast.error('فشل تسجيل البلاغ'); }
                                }}
                                className="p-6 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400 font-bold transition"
                            >
                                <Thermometer /> حرارة عالية
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.fetchWithAuth('/manufacturing/maintenance', {
                                            method: 'POST',
                                            body: JSON.stringify({ machine_id: Number(machineId), type: 'MECHANICAL', date: new Date().toISOString(), description: 'عطل ميكانيكي', cost: 0, status: 'OPEN', notes: 'تم الإبلاغ من الكشك الذكي' }),
                                        });
                                         toast.success('تم تسجيل بلاغ عطل ميكانيكي');
                                     } catch { toast.error('فشل تسجيل البلاغ'); }
                                }}
                                className="p-6 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 font-bold transition"
                            >
                                <Wrench /> عطل ميكانيكي
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.fetchWithAuth('/manufacturing/maintenance', {
                                            method: 'POST',
                                            body: JSON.stringify({ machine_id: Number(machineId), type: 'ELECTRICAL', date: new Date().toISOString(), description: 'مشكلة كهرباء', cost: 0, status: 'OPEN', notes: 'تم الإبلاغ من الكشك الذكي' }),
                                        });
                                         toast.success('تم تسجيل بلاغ مشكلة كهرباء');
                                     } catch { toast.error('فشل تسجيل البلاغ'); }
                                }}
                                className="p-6 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-2xl text-orange-400 font-bold transition"
                            >
                                <Zap /> مشكلة كهرباء
                            </button>
                            <button
                                onClick={async () => {
                                    const desc = prompt('وصف العطل:');
                                    if (!desc) return;
                                    try {
                                        await api.fetchWithAuth('/manufacturing/maintenance', {
                                            method: 'POST',
                                            body: JSON.stringify({ machine_id: Number(machineId), type: 'OTHER', date: new Date().toISOString(), description: desc, cost: 0, status: 'OPEN', notes: 'تم الإبلاغ من الكشك الذكي' }),
                                        });
                                         toast.success('تم تسجيل البلاغ');
                                     } catch { toast.error('فشل تسجيل البلاغ'); }
                                }}
                                className="p-6 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-2xl text-white font-bold transition"
                            >
                                <FileText /> عطل آخر
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
