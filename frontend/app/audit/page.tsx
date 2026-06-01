'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    created_at: string;
    details?: string;
    user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

export default function AuditLogPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.fetchWithAuth(`/audit?page=${page}&limit=${limit}`);
            setLogs(data.items || []);
            setTotalItems(data.total || 0);
            setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadLogs();
    }, [loadLogs, router]);

    const formatAction = (action: string) => {
        // Simple translation or formatting for actions
        const actions: Record<string, string> = {
            'CREATE': 'إنشاء',
            'UPDATE': 'تحديث',
            'DELETE': 'حذف',
            'LOGIN': 'تسجيل دخول',
        };
        return actions[action] || action;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 p-8 pt-24" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-slate-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                سجل العمليات (Audit Log)
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium text-sm">تتبع كافة التحركات والتغييرات في النظام</p>
                        </div>
                    </div>
                </header>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-sm border-b border-white/10">
                                    <th className="px-6 py-4 font-bold">المستخدم</th>
                                    <th className="px-6 py-4 font-bold">العملية</th>
                                    <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
                                    <th className="px-6 py-4 font-bold">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">جاري التحميل...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">لا توجد سجلات مسجلة</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                        {log.user?.firstName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-200">{log.user?.firstName} {log.user?.lastName}</p>
                                                        <p className="text-xs text-slate-500">{log.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                                                        log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400 font-medium font-mono">
                                                {new Date(log.created_at).toLocaleString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400" title={log.details}>
                                                    {log.details || 'بدون تفاصيل إضافية'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-slate-500 font-medium">عرض {logs.length} من {totalItems} سجل</p>
                        <div className="flex items-center gap-4">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-900/40">
                                {page} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
