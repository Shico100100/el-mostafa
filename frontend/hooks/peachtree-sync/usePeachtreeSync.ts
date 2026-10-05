'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
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
  id: string;
  entity: string;
  record_key: string;
  change_type: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  status?: string;
  created_at?: string;
}

export interface LogEntry {
  id: string;
  run_id: string;
  entity: string;
  action: string;
  created_at?: string;
  record_key?: string;
  changes?: Record<string, unknown> | null;
  triggered_by?: string;
}

export interface ReviewSummary {
  total: number;
  byEntity: { entity: string; count: number }[];
}

export interface ReviewJob {
  id: string;
  action: 'apply' | 'skip';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  total: number;
  done: number;
  applied: number;
  skipped: number;
  failed: number;
  percentComplete: number;
  currentEntity?: string;
  currentRecordKey?: string;
  errors: string[];
}

export function usePeachtreeSync() {
  const ready = useAuthCheck();
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
  const [syncPercent, setSyncPercent] = useState(0);
  const [syncEntity, setSyncEntity] = useState('');
  const [pendingSummary, setPendingSummary] = useState<ReviewSummary | null>(null);
  const [reviewJob, setReviewJob] = useState<ReviewJob | null>(null);
  const [reviewJobRunning, setReviewJobRunning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [
        historyData,
        configData,
        tablesData,
        reviewData,
        logData,
        summaryData,
        jobData,
      ] = await Promise.all([
        api.fetchWithAuth<SyncHistoryEntry[]>('/peachtree-sync/status'),
        api.fetchWithAuth<{ dsn: string }>('/peachtree-sync/config'),
        api.fetchWithAuth<string[]>('/peachtree-sync/tables').catch(() => []),
        api.fetchWithAuth<ReviewEntry[]>('/peachtree-sync/review'),
        api.fetchWithAuth<LogEntry[]>('/peachtree-sync/log'),
        // Bulk-review state is part of the same page load, so a refresh or a
        // reopened tab picks up a job that is still running server-side.
        api
          .fetchWithAuth<ReviewSummary>('/peachtree-sync/review/pending-summary')
          .catch(() => null),
        api
          .fetchWithAuth<{ running: boolean; job: ReviewJob | null }>(
            '/peachtree-sync/review/job-progress',
          )
          .catch(() => null),
      ]);
      setHistory(historyData || []);
      setDsn(configData?.dsn || '');
      setTables(tablesData || []);
      setReview(reviewData || []);
      setLogs(logData || []);
      if (summaryData) {
        setPendingSummary({
          total: summaryData.total ?? 0,
          byEntity: summaryData.byEntity ?? [],
        });
      }
      if (jobData) {
        setReviewJob(jobData.job ?? null);
        setReviewJobRunning(Boolean(jobData.running));
      }
    } catch { toast.error('فشل تحميل بيانات المزامنة'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  useEffect(() => {
    const checkInitialSync = async () => {
      try {
        const p = await api.fetchWithAuth<{ running: boolean; percentComplete: number; currentEntity: string; status: string }>('/peachtree-sync/progress');
        if (p.running) {
          setSyncing(true);
          setSyncPercent(p.percentComplete || 0);
          setSyncEntity(p.currentEntity || '');
          await pollSyncProgress();
          setSyncing(false);
        }
      } catch { /* silent */ }
    };
    checkInitialSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setSyncPercent(0);
    setSyncEntity('');
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
    setSyncPercent(0);
    setSyncEntity('');
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
        const progress = await api.fetchWithAuth<{ running: boolean; status: string; percentComplete: number; currentEntity: string }>('/peachtree-sync/progress');
        setSyncPercent(progress.percentComplete || 0);
        setSyncEntity(progress.currentEntity || '');
        if (!progress.running) {
          setSyncPercent(100);
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
    setSyncPercent(0);
    setSyncEntity('');
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
    setSyncPercent(0);
    setSyncEntity('');
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

  const applyReview = async (ids: (string | number)[]) => {
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

  const skipReview = async (ids: (string | number)[]) => {
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

  const loadPendingSummary = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<ReviewSummary>(
        '/peachtree-sync/review/pending-summary',
      );
      setPendingSummary({ total: data?.total ?? 0, byEntity: data?.byEntity ?? [] });
      return data;
    } catch {
      setPendingSummary({ total: 0, byEntity: [] });
      return null;
    }
  }, []);

  const pollReviewJob = useCallback(async () => {
    try {
      const p = await api.fetchWithAuth<{ running: boolean; job: ReviewJob | null }>(
        '/peachtree-sync/review/job-progress',
      );
      setReviewJob(p?.job ?? null);
      if (p?.running) {
        setReviewJobRunning(true);
        return true;
      }
      setReviewJobRunning(false);
      return false;
    } catch {
      setReviewJobRunning(false);
      return false;
    }
  }, []);

  const startReviewJob = useCallback(
    async (action: 'apply' | 'skip') => {
      setReviewJobRunning(true);
      setReviewJob({
        id: 'starting', action, status: 'running', startedAt: new Date().toISOString(),
        total: pendingSummary?.total ?? 0, done: 0, applied: 0, skipped: 0,
        failed: 0, percentComplete: 0, currentEntity: '', currentRecordKey: '', errors: [],
      });
      try {
        const endpoint =
          action === 'apply'
            ? '/peachtree-sync/review/apply-all'
            : '/peachtree-sync/review/skip-all';
        const job = await api.fetchWithAuth<ReviewJob>(endpoint, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        setReviewJob(job);
      } catch {
        setReviewJobRunning(false);
        setReviewJob(null);
        toast.error(
          action === 'apply' ? 'فشل بدء عملية القبول' : 'فشل بدء عملية التجاهل',
        );
      }
    },
    [pendingSummary?.total],
  );

  // Resume an already-running job is handled inside loadData, so a refresh or a
  // reopened tab shows the live job without a second competing request.

  // Poll while running. 1500ms keeps the number readable and the endpoint is
  // exempt from the global rate limit.
  useEffect(() => {
    if (!reviewJobRunning) return;
    const id = setInterval(async () => {
      const stillRunning = await pollReviewJob();
      if (!stillRunning) {
        clearInterval(id);
        loadData();
        loadPendingSummary();
        const job = (await api.fetchWithAuth<{ job: ReviewJob | null }>(
          '/peachtree-sync/review/job-progress',
        ).catch(() => null))?.job;
        if (job) {
          const verb = job.action === 'apply' ? 'قبول' : 'تجاهل';
          if (job.failed > 0) {
            toast.error(
              `انتهت عملية ${verb}: ${job.done} من ${job.total}، فشل ${job.failed}`,
            );
          } else {
            toast.success(`انتهت عملية ${verb}: ${job.done} من ${job.total}`);
          }
        }
      }
    }, 1500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewJobRunning]);

  const saveConfig = async () => {
    try {
      await api.fetchWithAuth('/peachtree-sync/config', { method: 'PUT', body: JSON.stringify({ dsn }) });
      toast.success('تم حفظ الإعدادات');
    } catch { toast.error('حدث خطأ'); }
  };

  return {
    loading, syncing, resyncing, testing, applying, previewing,
    connected, connectionError, history, tables, dsn,
    review, logs, syncPercent, syncEntity,
    pendingSummary, reviewJob, reviewJobRunning,
    setDsn, testConnection, runSync, runIncrementalSync, resyncItems,
    syncInvoices, saveConfig, previewSync, applyReview, skipReview,
    loadReview, loadLogs, loadPendingSummary, startReviewJob, pollReviewJob,
  };
}
