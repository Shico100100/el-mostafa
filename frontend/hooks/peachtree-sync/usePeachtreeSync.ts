'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function usePeachtreeSync() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [dsn, setDsn] = useState('');
  const [connectionError, setConnectionError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [historyData, configData, tablesData] = await Promise.all([
        api.fetchWithAuth<any[]>('/peachtree-sync/status'),
        api.fetchWithAuth<{ dsn: string }>('/peachtree-sync/config'),
        api.fetchWithAuth<string[]>('/peachtree-sync/tables').catch(() => []),
      ]);
      setHistory(historyData || []);
      setDsn(configData?.dsn || '');
      setTables(tablesData || []);
    } catch { toast.error('فشل تحميل بيانات المزامنة'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await api.fetchWithAuth<{ connected: boolean; error?: string }>('/peachtree-sync/test', { method: 'POST' });
      setConnected(result.connected);
      setConnectionError(result.error || '');
      toast.success(result.connected ? 'تم الاتصال بنجاح' : 'فشل الاتصال');
    } catch {
      setConnected(false);
      setConnectionError('حدث خطأ غير متوقع');
      toast.error('حدث خطأ أثناء الاتصال');
    }
    finally { setTesting(false); }
  };

  const runSync = async (mode: 'full' | 'incremental' = 'full') => {
    setSyncing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string; id?: string }>('/peachtree-sync/run', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      if (start.status === 'running') {
        toast.info(mode === 'incremental' ? 'بدأت إعادة المزامنة الذكية في الخلفية...' : 'بدأت المزامنة في الخلفية...');
        await pollSyncProgress();
      } else {
        toast.success(start.message || 'تمت المزامنة بنجاح');
        loadData();
      }
    } catch { toast.error('فشلت المزامنة'); }
    finally { setSyncing(false); }
  };

  const runIncrementalSync = async () => {
    setSyncing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string; id?: string }>('/peachtree-sync/run-incremental', { method: 'POST' });
      if (start.status === 'running') {
        toast.info('بدأت إعادة المزامنة الذكية في الخلفية...');
        await pollSyncProgress();
      } else {
        toast.success(start.message || 'تمت إعادة المزامنة');
        loadData();
      }
    } catch { toast.error('فشلت إعادة المزامنة الذكية'); }
    finally { setSyncing(false); }
  };

  const pollSyncProgress = async () => {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const progress = await api.fetchWithAuth<{ running: boolean; status: string; percentComplete: number }>('/peachtree-sync/progress');
        if (!progress.running) {
          if (progress.status === 'completed') {
            toast.success('تمت المزامنة بنجاح');
          } else {
            toast.error('فشلت المزامنة — تحقق من السجل');
          }
          loadData();
          return;
        }
      } catch { break; }
    }
    toast.error('انتهت مهلة الانتظار — المزامنة قد لا تزال تعمل');
    loadData();
  };

  const resyncItems = async () => {
    setResyncing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string; id?: string }>('/peachtree-sync/resync-items', { method: 'POST' });
      if (start.status === 'running') {
        toast.info('بدأت إعادة مزامنة الأصناف في الخلفية...');
        await pollSyncProgress();
      } else {
        toast.success(start.message || 'تم إعادة مزامنة الأصناف');
        loadData();
      }
    } catch { toast.error('فشل إعادة مزامنة الأصناف'); }
    finally { setResyncing(false); }
  };

  const syncInvoices = async (entities: string[]) => {
    setSyncing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string; entities?: string[] }>('/peachtree-sync/run-partial', {
        method: 'POST',
        body: JSON.stringify({ entities }),
      });
      if (start.status === 'running') {
        toast.info('بدأت مزامنة الفواتير في الخلفية...');
        await pollSyncProgress();
      } else {
        toast.success(start.message || 'تمت المزامنة');
        loadData();
      }
    } catch { toast.error('فشلت مزامنة الفواتير'); }
    finally { setSyncing(false); }
  };

  const saveConfig = async () => {
    try {
      await api.fetchWithAuth('/peachtree-sync/config', { method: 'PUT', body: JSON.stringify({ dsn }) });
      toast.success('تم حفظ الإعدادات');
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, syncing, resyncing, testing, connected, connectionError, history, tables, dsn, setDsn, testConnection, runSync, runIncrementalSync, resyncItems, syncInvoices, saveConfig };
}
