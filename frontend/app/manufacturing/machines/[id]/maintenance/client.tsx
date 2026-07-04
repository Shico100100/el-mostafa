'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Wrench } from 'lucide-react';

interface Maintenance {
    id: number;
    date: string;
    type: string;
    description: string;
    cost: number;
    status: string;
}

interface Machine {
    id: number;
    name: string;
}

export default function MachineMaintenancePage() {
    const router = useRouter();
    const params = useParams();
    const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
    const [machine, setMachine] = useState<Machine | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [maintenanceData, machineData] = await Promise.all([
                api.fetchWithAuth(`/manufacturing/maintenance?machine_id=${params.id}`),
                api.fetchWithAuth(`/manufacturing/machines`),
            ]);

            const currentMachine = (machineData as Machine[]).find((m) => m.id === Number(params.id));
            setMachine(currentMachine || null);
            setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            machine_id: Number(params.id),
            type: formData.get('type'),
            date: formData.get('date'),
            description: formData.get('description'),
            cost: formData.get('cost'),
            status: formData.get('status'),
            notes: formData.get('notes'),
        };

        try {
            await api.fetchWithAuth('/manufacturing/maintenance', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving maintenance:', error);
        }
    };

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
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Wrench /> سجل الصيانة</h1>
                        <p className="text-gray-400 text-sm mt-1">الماكينة: {machine?.name}</p>
                    </div>
                    <button
                        onClick={() => router.push('/manufacturing/machines')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        عودة للماكينات
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition"
                    >
                        + تسجيل صيانة/عطل
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">النوع</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الوصف</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">التكلفة</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenance.map((item) => (
                                <tr key={item.id} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-200">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${item.type === 'BREAKDOWN' ? 'bg-red-500/20 text-red-200' : 'bg-blue-500/20 text-blue-200'
                                            }`}>
                                            {item.type === 'BREAKDOWN' ? 'عطل' : 'صيانة دورية'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{item.description}</td>
                                    <td className="px-6 py-4 text-gray-300">{item.cost} جنيه</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${item.status === 'COMPLETED' ? 'bg-green-500/20 text-green-200' : 'bg-yellow-500/20 text-yellow-200'
                                            }`}>
                                            {item.status === 'COMPLETED' ? 'تم الإصلاح' : 'قيد العمل'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {maintenance.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد سجلات صيانة لهذه الماكينة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تسجيل صيانة جديدة</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                <input
                                    name="date"
                                    type="date"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">النوع</label>
                                <select
                                    name="type"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="BREAKDOWN">عطل مفاجئ</option>
                                    <option value="SCHEDULED">صيانة دورية</option>
                                    <option value="PREVENTIVE">صيانة وقائية</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الوصف</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">التكلفة (جنيه)</label>
                                <input
                                    name="cost"
                                    type="number"
                                    step="0.01"
                                    defaultValue="0"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الحالة</label>
                                <select
                                    name="status"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="PENDING">قيد الانتظار</option>
                                    <option value="IN_PROGRESS">جاري العمل</option>
                                    <option value="COMPLETED">تم الإصلاح</option>
                                </select>
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700"
                                >
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
