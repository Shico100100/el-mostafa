'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [ringing, setRinging] = useState(false);
  const prevRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetch = () => {
      api.getNotifications().then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const count = arr.filter((n: { isRead: boolean }) => !n.isRead).length;
        if (count > prevRef.current && prevRef.current > 0) {
          setRinging(true);
          setTimeout(() => setRinging(false), 1000);
        }
        prevRef.current = count;
        setUnreadCount(count);
      }).catch(() => setUnreadCount(0));
    };
    fetch();
    intervalRef.current = setInterval(fetch, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <button className={`relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition group ${ringing ? 'animate-bounce' : ''}`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-slate-900">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
