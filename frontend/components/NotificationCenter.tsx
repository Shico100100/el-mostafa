'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Bell } from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    actionType: string;
    createdAt: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth('/v1/notifications');
            const list = Array.isArray(data) ? data : [];
            setNotifications(list.slice(0, 10));
            setUnreadCount(list.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }, []);

    useEffect(() => {
        const initialFetch = setTimeout(loadNotifications, 0);
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => {
            clearTimeout(initialFetch);
            clearInterval(interval);
        };
    }, [loadNotifications]);

    const markAsRead = async (id: number) => {
        try {
            await api.fetchWithAuth(`/v1/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.fetchWithAuth('/v1/notifications/mark-all-read', { method: 'PATCH' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (actionType: string) => {
        switch (actionType) {
            case 'new_order': return '🛒';
            case 'low_stock': return '⚠️';
            case 'maintenance': return '🔧';
            case 'payment': return '💰';
            case 'production': return '🏭';
            default: return '📢';
        }
    };

    const getTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'الآن';
        if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
        if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
        return `منذ ${Math.floor(seconds / 86400)} يوم`;
    };

    return (
        <div className="relative">
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Notification Panel */}
                    <div className="absolute left-0 mt-2 w-96 bg-slate-800 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                            <h3 className="text-white font-bold text-lg">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                    تعليم الكل كمقروء
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>لا توجد إشعارات</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!notification.isRead ? 'bg-emerald-500/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="text-2xl">{getNotificationIcon(notification.actionType)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`font-semibold ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-[#ecfdf5]0 mt-2">
                                                    {getTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/10 text-center">
                                <button className="text-sm text-blue-400 hover:text-blue-300 transition">
                                    عرض جميع الإشعارات
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
