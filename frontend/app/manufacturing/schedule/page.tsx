'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CalendarDays } from 'lucide-react';

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
        <div className="min-h-screen bg-[#0a0f0d] text-white" dir="rtl">
            <header className="glass border-b border-[#1f2d26] bg-[#0a0f0d]/50 backdrop-blur-lg sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl"><CalendarDays /></span>
                        جدولة الإنتاج (Gantt Scheduler)
                    </h1>
                    <button onClick={() => router.push('/manufacturing')} className="text-[#6b8378] hover:text-white transition">
                        العودة للمصنع
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-[#6b8378]">جاري تحميل الجدول...</div>
                ) : (
                    <div className="min-w-[1000px] bg-[#0f1714] rounded-3xl border border-[#1f2d26] overflow-hidden relative">
                        {/* Header Row (Hours) */}
                        <div className="flex bg-[#16241d]/50 border-b border-[#1f2d26]">
                            <div className="w-48 p-4 font-bold border-l border-[#1f2d26] sticky left-0 bg-[#16241d]/50 z-20">الماكينة</div>
                            <div className="flex-1 relative h-12">
                                {hours.map(h => (
                                    <div key={h} className="absolute top-0 bottom-0 border-l border-[#1f2d26] text-xs text-[#6b8378] p-1" style={{ left: `${(h / 24) * 100}%` }}>
                                        {h}:00
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Machine Rows */}
                        <div className="bg-grid-white/[0.02]">
                            {machines.map(machine => (
                                <div key={machine.id} className="flex border-b border-[#1f2d26] hover:bg-[#121a16] transition group">
                                    <div className="w-48 p-4 border-l border-[#1f2d26] font-bold flex items-center gap-2 sticky left-0 bg-[#0f1714] z-10 group-hover:bg-[#16241d]/50">
                                        <div className={`w-3 h-3 rounded-full ${machine.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-[#6b8378]'}`}></div>
                                        {machine.name}
                                    </div>
                                    <div className="flex-1 relative h-20">
                                        {/* Grid Lines */}
                                        {hours.map(h => (
                                            <div key={h} className="absolute top-0 bottom-0 border-l border-[#1f2d26]" style={{ left: `${(h / 24) * 100}%` }}></div>
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
                                                        className="absolute top-2 bottom-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/30 overflow-hidden shadow-lg hover:brightness-110 transition cursor-pointer flex items-center px-2"
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
