'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useSetBackButton, GO_BACK } from '@/components/BackButton';

interface MachineHistory {
    mold: { name: string };
    startDate: string;
    endDate: string;
    pieces: number;
    totalCost: number;
}

export default function MachineDetailsPage() {
    useSetBackButton(GO_BACK);
    const params = useParams();
    const [history, setHistory] = useState<MachineHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth(`/manufacturing/machines/${params.id}/history`);
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            loadData();
        }
    }, [params.id, loadData]);

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
                    <h1 className="text-2xl font-bold text-white">سجل الماكينة</h1>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">الإسطمبة</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">تاريخ التركيب</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">تاريخ التغيير</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">إجمالي الإنتاج</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">متوسط التكلفة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record, index) => (
                                <tr key={index} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-200">{record.mold?.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{new Date(record.startDate).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 text-gray-300">{new Date(record.endDate).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 text-gray-300">{record.pieces} قطعة</td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {record.pieces > 0
                                            ? (record.totalCost / record.pieces).toFixed(2)
                                            : 0} جنيه
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        لا يوجد سجل إنتاج لهذه الماكينة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
