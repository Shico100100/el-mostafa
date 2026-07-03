'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface AuditLog {
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

export function useAuditLog() {
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
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadLogs();
  }, [loadLogs, router]);

  const formatAction = (action: string) => {
    const actions: Record<string, string> = { CREATE: 'إنشاء', UPDATE: 'تحديث', DELETE: 'حذف', LOGIN: 'تسجيل دخول' };
    return actions[action] || action;
  };

  return { logs, loading, page, totalPages, totalItems, setPage, formatAction };
}
