'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Machine {
    id: number;
    name: string;
    status: string;
}

interface Production {
    id: number;
    machine_id: number;
    start_time?: string;
    end_time?: string;
    mold?: { name: string };
}

export default function SchedulerPage() {
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [machinesData, prodData] = await Promise.all([
                api.fetchWithAuth('/manufacturing/machines'),
                api.fetchWithAuth('/manufacturing/production')
            ]);
            setMachines(Array.isArray(machinesData) ? machinesData : []);
            setProductions(Array.isArray(prodData) ? prodData : []);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Simple Timeline Visualization
    // Hours 0-24
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getBarPosition = (prod: Production) => {
        if (!prod.start_time || !prod.end_time) return null;
        const start = new Date(prod.start_time);
        const end = new Date(prod.end_time);

        const startHour = start.getHours() + (start.getMinutes() / 60);
        const endHour = end.getHours() + (end.getMinutes() / 60);

        const duration = endHour - startHour;

        return {
            left: `${(startHour / 24) * 100}%`,
            width: `${(duration / 24) * 100}%`
        };
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
            <header className="glass border-b border-white/5 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">🗓️</span>
                        جدولة الإنتاج (Gantt Scheduler)
                    </h1>
                    <button onClick={() => router.push('/manufacturing')} className="text-slate-400 hover:text-white transition">
                        العودة للمصنع
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-slate-500">جاري تحميل الجدول...</div>
                ) : (
                    <div className="min-w-[1000px] bg-slate-800 rounded-3xl border border-white/10 overflow-hidden relative">
                        {/* Header Row (Hours) */}
                        <div className="flex bg-slate-700/50 border-b border-white/10">
                            <div className="w-48 p-4 font-bold border-l border-white/10 sticky left-0 bg-slate-700/50 z-20">الماكينة</div>
                            <div className="flex-1 relative h-12">
                                {hours.map(h => (
                                    <div key={h} className="absolute top-0 bottom-0 border-l border-white/5 text-xs text-slate-400 p-1" style={{ left: `${(h / 24) * 100}%` }}>
                                        {h}:00
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Machine Rows */}
                        <div className="bg-grid-white/[0.02]">
                            {machines.map(machine => (
                                <div key={machine.id} className="flex border-b border-white/5 hover:bg-white/5 transition group">
                                    <div className="w-48 p-4 border-l border-white/10 font-bold flex items-center gap-2 sticky left-0 bg-slate-800 z-10 group-hover:bg-slate-700/50">
                                        <div className={`w-3 h-3 rounded-full ${machine.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                        {machine.name}
                                    </div>
                                    <div className="flex-1 relative h-20">
                                        {/* Grid Lines */}
                                        {hours.map(h => (
                                            <div key={h} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${(h / 24) * 100}%` }}></div>
                                        ))}

                                        {/* Tasks */}
                                        {productions
                                            .filter(p => p.machine_id === machine.id)
                                            .map(prod => {
                                                const pos = getBarPosition(prod);
                                                if (!pos) return null;
                                                return (
                                                    <div
                                                        key={prod.id}
                                                        className="absolute top-2 bottom-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/30 overflow-hidden shadow-lg hover:brightness-110 transition cursor-pointer flex items-center px-2"
                                                        style={{ left: pos.left, width: pos.width }}
                                                        title={`Production #${prod.id} - ${prod.mold?.name}`}
                                                    >
                                                        <div className="truncate text-xs font-bold text-white">
                                                            {prod.mold?.name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
