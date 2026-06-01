'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Worker {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface AttendanceRecord {
    id: number;
    user_id: number;
    user?: Worker;
    date: string;
    status: string;
    check_in?: string;
    check_out?: string;
    notes?: string;
}

export default function AttendancePage() {
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [attendanceData, workersData] = await Promise.all([
                api.getAttendance(),
                api.getWorkers()
            ]);
            setAttendance(attendanceData);
            setWorkers(workersData);
        } catch (error) {
            console.error('Failed to load attendance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: editingRecord?.id,
            user_id: Number(formData.get('user_id')),
            date: date,
            status: formData.get('status') as string,
            check_in: (formData.get('check_in') as string) || null,
            check_out: (formData.get('check_out') as string) || null,
            notes: formData.get('notes') as string,
        };

        try {
            await api.saveAttendance(data);
            setShowModal(false);
            setEditingRecord(null);
            loadData();
        } catch (error: unknown) {
            const err = error as { message?: string };
            alert(err?.message || 'حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            try {
                await api.deleteAttendance(id);
                loadData();
            } catch {
                alert('حدث خطأ أثناء الحذف');
            }
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'حاضر';
            case 'ABSENT': return 'غائب';
            case 'LATE': return 'متأخر';
            case 'EXCUSED': return 'إذن';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'text-emerald-400 bg-emerald-400/10';
            case 'ABSENT': return 'text-rose-400 bg-rose-400/10';
            case 'LATE': return 'text-amber-400 bg-amber-400/10';
            case 'EXCUSED': return 'text-blue-400 bg-blue-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-full text-white transition"
                        >
                            ➡️
                        </button>
                        <h1 className="text-2xl font-bold text-white">الغياب والحضور</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                        <button
                            onClick={() => {
                                setEditingRecord(null);
                                setShowModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-bold shadow-lg shadow-blue-600/20"
                        >
                            + تسجيل جديد
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : attendance.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-6xl block mb-4">📅</span>
                        <h3 className="text-xl font-bold text-gray-400">لا يوجد سجلات حضور لهذا اليوم</h3>
                        <p className="text-gray-500 mt-2 text-sm">اضغط على زر &quot;تسجيل جديد&quot; للبدء</p>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
                        <table className="w-full text-right border-collapse min-w-[800px]">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">الموظف</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">الحالة</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">الحضور</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">الانصراف</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">ملاحظات</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-300">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {attendance.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{row.user?.firstName} {row.user?.lastName}</div>
                                            <div className="text-xs text-gray-500">{row.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(row.status)}`}>
                                                {translateStatus(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono">{row.check_in || '--:--'}</td>
                                        <td className="px-6 py-4 text-sm font-mono">{row.check_out || '--:--'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{row.notes || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingRecord(row);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row.id)}
                                                    className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-xl font-bold">{editingRecord ? 'تعديل سجل حضور' : 'تسجيل حضور جديد'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">الموظف</label>
                                <select
                                    name="user_id"
                                    defaultValue={editingRecord?.user_id}
                                    required
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition appearance-none"
                                >
                                    <option value="">اختر الموظف...</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">الحالة</label>
                                <select
                                    name="status"
                                    defaultValue={editingRecord?.status || 'PRESENT'}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition appearance-none"
                                >
                                    <option value="PRESENT">حاضر</option>
                                    <option value="ABSENT">غائب</option>
                                    <option value="LATE">متأخر</option>
                                    <option value="EXCUSED">إذن / عذر</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">وقت الحضور</label>
                                    <input
                                        type="time"
                                        name="check_in"
                                        defaultValue={editingRecord?.check_in}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">وقت الانصراف</label>
                                    <input
                                        type="time"
                                        name="check_out"
                                        defaultValue={editingRecord?.check_out}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">ملاحظات</label>
                                <textarea
                                    name="notes"
                                    defaultValue={editingRecord?.notes}
                                    rows={3}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                                    placeholder="أي ملاحظات إضافية..."
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                                >
                                    حفظ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2 rounded-lg transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
