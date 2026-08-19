'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Machine {
    id: number;
    name: string;
    status: string;
}

export default function KioskLandingPage() {
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMachines = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth('/manufacturing/machines');
            const machinesArray: Machine[] = Array.isArray(data) ? data : [];
            setMachines(machinesArray.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Error loading machines:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMachines();
    }, [loadMachines]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#05080a] flex items-center justify-center">
                <div className="text-white text-4xl font-bold animate-pulse">جاري تحميل الماكينات...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05080a] text-white p-8" dir="rtl">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">
                    اختر ماكينة للبدء
                </h1>
                <p className="text-xl text-[#6b8378]">نظام تسجيل الإنتاج الفوري</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {machines.map((machine) => (
                    <button
                        key={machine.id}
                        onClick={() => router.push(`/manufacturing/kiosk/${machine.id}`)}
                        className={`
                            relative overflow-hidden group p-8 rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${machine.status === 'RUNNING'
                                ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-400'
                                : machine.status === 'MAINTENANCE' || machine.status === 'BROKEN'
                                    ? 'bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20 hover:border-rose-400'
                                    : 'bg-[#0f1714]/50 border-[#1f2d26] hover:bg-[#0f1714] hover:border-white/30'
                            }
                        `}
                    >
                        <div className="text-6xl mb-6 transform group-hover:-translate-y-2 transition duration-300 flex items-center justify-center">
                            {machine.status === 'RUNNING' ? <div className="w-12 h-12 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" /> : machine.status === 'MAINTENANCE' ? <div className="w-12 h-12 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" /> : <div className="w-12 h-12 bg-gray-400 rounded-full" />}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">{machine.name}</h2>
                        <span className={`
                            inline-block px-4 py-1 rounded-full text-lg font-bold
                            ${machine.status === 'RUNNING' ? 'text-emerald-400 bg-emerald-500/20' : 'text-[#6b8378] bg-[#16241d]/50'}
                        `}>
                            {machine.status === 'RUNNING' ? 'تعمل الآن' : 'متوقفة'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
