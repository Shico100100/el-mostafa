'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';

interface Machine {
    id: number;
    name: string;
    last_maintenance: string | null;
    next_maintenance: string | null;
    status: string;
    maintenance_interval_days: number;
}

interface MaintenanceLog {
    id: number;
    date: string;
    machine: { name: string };
    type: string;
    description: string;
    cost: number;
    status: string;
}

export default function MaintenancePage() {
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        machine_id: '',
        type: 'SCHEDULED',
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        status: 'PENDING',
        notes: ''
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [machinesData, logsData] = await Promise.all([
                api.fetchWithAuth('/manufacturing/machines'),
                api.fetchWithAuth('/manufacturing/maintenance')
            ]);
            setMachines(sortAlphabetically(machinesData, 'name'));
            setMaintenanceLogs(Array.isArray(logsData) ? logsData : []);
        } catch (error) {
            console.error('Error loading maintenance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.fetchWithAuth('/manufacturing/maintenance', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    machine_id: Number(formData.machine_id),
                    cost: formData.cost ? Number(formData.cost) : 0
                })
            });
            setShowModal(false);
            loadData();
            setFormData({
                machine_id: '',
                type: 'SCHEDULED',
                date: new Date().toISOString().split('T')[0],
                description: '',
                cost: '',
                status: 'PENDING',
                notes: ''
            });
        } catch {
            alert('Error creating maintenance log');
        }
    };

    const getOverdueCount = () => {
        const today = new Date();
        return machines.filter(m => m.next_maintenance && new Date(m.next_maintenance) < today).length;
    };

    const getUpcomingCount = () => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return machines.filter(m =>
            m.next_maintenance &&
            new Date(m.next_maintenance) >= today &&
            new Date(m.next_maintenance) <= nextWeek
        ).length;
    };

    if (loading) return <div className="p-8 text-white center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            🛠️ إدارة الصيانة
                        </h1>
                        <p className="text-slate-400 mt-1">جدولة ومتابعة صيانة الماكينات والمعدات</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            + تسجيل صيانة جديدة
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10"
                        >
                            رجوع
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
                        <h3 className="text-red-400 font-bold mb-2">صيانة متأخرة</h3>
                        <p className="text-4xl font-black text-white">{getOverdueCount()}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl">
                        <h3 className="text-amber-400 font-bold mb-2">صيانة خلال 7 أيام</h3>
                        <p className="text-4xl font-black text-white">{getUpcomingCount()}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
                        <h3 className="text-blue-400 font-bold mb-2">إجمالي الماكينات</h3>
                        <p className="text-4xl font-black text-white">{machines.length}</p>
                    </div>
                </div>

                {/* Machine Schedule Table */}
                <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">📅 جدول الصيانة القادمة</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="p-4 text-slate-400">الماكينة</th>
                                    <th className="p-4 text-slate-400">آخر صيانة</th>
                                    <th className="p-4 text-slate-400">الصيانة القادمة</th>
                                    <th className="p-4 text-slate-400">الحالة</th>
                                    <th className="p-4 text-slate-400">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map((machine) => {
                                    const nextDate = machine.next_maintenance ? new Date(machine.next_maintenance) : null;
                                    const isOverdue = nextDate && nextDate < new Date();

                                    return (
                                        <tr key={machine.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-bold">{machine.name}</td>
                                            <td className="p-4">
                                                {machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString('ar-EG') : '---'}
                                            </td>
                                            <td className="p-4">
                                                <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                                    {machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${machine.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                                                    machine.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {machine.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, machine_id: String(machine.id) });
                                                        setShowModal(true);
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 font-bold"
                                                >
                                                    تسجيل صيانة
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance History */}
                <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">📜 سجل العمليات السابقة</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="p-4 text-slate-400">التاريخ</th>
                                    <th className="p-4 text-slate-400">الماكينة</th>
                                    <th className="p-4 text-slate-400">النوع</th>
                                    <th className="p-4 text-slate-400">الوصف</th>
                                    <th className="p-4 text-slate-400">التكلفة</th>
                                    <th className="p-4 text-slate-400">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenanceLogs.map((log) => (
                                    <tr key={log.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">{new Date(log.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-4 font-bold">{log.machine?.name}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs">
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">{log.description}</td>
                                        <td className="p-4 font-bold">{Number(log.cost).toLocaleString()} ج.م</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                                                log.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {log.status === 'COMPLETED' ? 'مكتمل' :
                                                    log.status === 'IN_PROGRESS' ? 'جاري العمل' : 'قيد الانتظار'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {maintenanceLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500">لا يوجد سجل صيانة حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden scale-in">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold">تسجيل عملية صيانة</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الماكينة</label>
                                    <select
                                        required
                                        value={formData.machine_id}
                                        onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">اختر الماكينة</option>
                                        {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">النوع</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                    >
                                        <option value="SCHEDULED">دورية</option>
                                        <option value="BREAKDOWN">عطل مفاجئ</option>
                                        <option value="PREVENTIVE">وقائية</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">التكلفة (ج.م)</label>
                                    <input
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الوصف</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none h-24"
                                    placeholder="وصف تفصيلي للعملية..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الحالة</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none"
                                >
                                    <option value="PENDING">معلق</option>
                                    <option value="IN_PROGRESS">جاري العمل</option>
                                    <option value="COMPLETED">مكتمل</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all"
                                >
                                    حفظ البيانات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .scale-in {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
