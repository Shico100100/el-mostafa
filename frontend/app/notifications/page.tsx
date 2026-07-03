'use client';

import { ArrowRight, Bell, BellOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Notification {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    actionType?: 'delete_movement' | 'delete_order' | string;
    actionData?: Record<string, string | number>;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.markNotificationAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleApprove = async (notification: Notification) => {
        try {
            const actionData = notification.actionData ?? {};
            if (notification.actionType === 'delete_movement') {
                const movementId = actionData.movementId;
                await api.fetchWithAuth(`/v1/inventory/stock/movements/${movementId}`, { method: 'DELETE' });
                toast.success('تم حذف الحركة بنجاح');
            } else if (notification.actionType === 'delete_order') {
                const orderId = actionData.orderId;
                await api.fetchWithAuth(`/v1/purchases/orders/${orderId}`, { method: 'DELETE' });
                toast.success('تم حذف أمر الشراء بنجاح');
            }
            await api.markNotificationAsRead(notification.id);
            loadNotifications();
        } catch {
            toast.error('حدث خطأ أثناء التنفيذ');
        }
    };

    const filteredNotifications = filter === 'ALL'
        ? notifications
        : notifications.filter(n => !n.isRead);

    if (loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100" dir="rtl">
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white transition"><ArrowRight className="w-5 h-5" /></button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6" /> مركز التنبيهات</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-6 py-2 rounded-xl transition font-bold ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('UNREAD')}
                        className={`px-6 py-2 rounded-xl transition font-bold ${filter === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}
                    >
                        غير المقروءة
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredNotifications.map((n) => (
                        <div key={n.id} className={`glass p-6 rounded-2xl border ${!n.isRead ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5 opacity-80'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`text-lg font-bold ${!n.isRead ? 'text-blue-300' : 'text-slate-300'}`}>{n.title}</h3>
                                <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString('ar-EG')}</span>
                            </div>
                            <p className="text-slate-400 mb-6">{n.message}</p>

                            <div className="flex gap-3 justify-end">
                                {!n.isRead && (
                                    <>
                                        {n.actionType && (
                                            <button
                                                onClick={() => handleApprove(n)}
                                                className="px-6 py-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl transition text-sm font-bold"
                                            >
                                                الموافقة على الطلب
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className="px-6 py-2 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl transition text-sm font-bold"
                                        >
                                            تحديد كمقروء
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            <div className="text-6xl mb-4"><BellOff className="w-16 h-16 mx-auto text-gray-500" /></div>
                            لا توجد تنبيهات
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
