'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface SyncEntityResult {
  entity: string;
  status?: string;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors?: string[];
}

export interface SyncHistoryEntry {
  id: string;
  startedAt?: string;
  started_at?: string;
  status?: string;
  records_synced?: number;
  duration_ms?: number;
  results?: SyncEntityResult[];
}

export interface ReviewEntry {
  id: number;
  entity: string;
  record_key: string;
  change_type: 'update' | 'missing';
  db_record_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  status: string;
  created_at?: string;
}

export interface LogEntry {
  id: number;
  run_id: string;
  triggered_by: string;
  entity: string;
  action: string;
  record_key: string;
  changes: Record<string, [unknown, unknown]> | null;
  created_at?: string;
}

export function usePeachtreeSync() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [dsn, setDsn] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [review, setReview] = useState<ReviewEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [historyData, configData, tablesData, reviewData, logData] =
        await Promise.all([
          api.fetchWithAuth<SyncHistoryEntry[]>('/peachtree-sync/status'),
          api.fetchWithAuth<{ dsn: string }>('/peachtree-sync/config'),
          api.fetchWithAuth<string[]>('/peachtree-sync/tables').catch(() => []),
          api.fetchWithAuth<ReviewEntry[]>('/peachtree-sync/review'),
          api.fetchWithAuth<LogEntry[]>('/peachtree-sync/log'),
        ]);
      setHistory(historyData || []);
      setDsn(configData?.dsn || '');
      setTables(tablesData || []);
      setReview(reviewData || []);
      setLogs(logData || []);
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

  const previewSync = async () => {
    setPreviewing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string }>(
        '/peachtree-sync/preview',
        { method: 'POST' },
      );
      if (start.status === 'running') {
        toast.info('بدأت المعاينة في الخلفية...');
        await pollSyncProgress();
      }
      await loadData();
    } catch { toast.error('فشلت المعاينة'); }
    finally { setPreviewing(false); }
  };

  const loadReview = async () => {
    try {
      const data = await api.fetchWithAuth<ReviewEntry[]>('/peachtree-sync/review');
      setReview(data || []);
    } catch { toast.error('فشل تحميل تقرير الفروقات'); }
  };

  const loadLogs = async () => {
    try {
      const data = await api.fetchWithAuth<LogEntry[]>('/peachtree-sync/log');
      setLogs(data || []);
    } catch { /* silent */ }
  };

  const applyReview = async (ids: number[]) => {
    if (!ids.length) return;
    setApplying(true);
    try {
      const result = await api.fetchWithAuth<{ applied: number; errors: string[] }>(
        '/peachtree-sync/review/apply',
        { method: 'POST', body: JSON.stringify({ ids }) },
      );
      toast.success(`تم تطبيق ${result.applied} تغيير`);
      if (result.errors?.length) toast.error(`فشل ${result.errors.length} — ${result.errors[0]}`);
      await loadData();
    } catch { toast.error('فشل تطبيق التغييرات'); }
    finally { setApplying(false); }
  };

  const skipReview = async (ids: number[]) => {
    if (!ids.length) return;
    setApplying(true);
    try {
      const result = await api.fetchWithAuth<{ skipped: number }>(
        '/peachtree-sync/review/skip',
        { method: 'POST', body: JSON.stringify({ ids }) },
      );
      toast.success(`تم تجاهل ${result.skipped} تغيير`);
      await loadData();
    } catch { toast.error('فشل تجاهل التغييرات'); }
    finally { setApplying(false); }
  };

  const saveConfig = async () => {
    try {
      await api.fetchWithAuth('/peachtree-sync/config', { method: 'PUT', body: JSON.stringify({ dsn }) });
      toast.success('تم حفظ الإعدادات');
    } catch { toast.error('حدث خطأ'); }
  };

  return {
    loading, syncing, resyncing, testing, applying, previewing,
    connected, connectionError, history, tables, dsn,
    review, logs,
    setDsn, testConnection, runSync, runIncrementalSync, resyncItems,
    syncInvoices, saveConfig, previewSync, applyReview, skipReview,
    loadReview, loadLogs,
  };
}
