import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi as vitestVi } from 'vitest';

const mocks = vitestVi.hoisted(() => {
  const push = vi.fn();
  const router = { push };
  const fetchWithAuth = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  const toastInfo = vi.fn();
  return { router, push, fetchWithAuth, toastSuccess, toastError, toastInfo };
});

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
}));

vi.mock('@/lib/api', () => ({
  api: {
    fetchWithAuth: (...args: Parameters<typeof mocks.fetchWithAuth>) => mocks.fetchWithAuth(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: Parameters<typeof mocks.toastSuccess>) => mocks.toastSuccess(...args),
    error: (...args: Parameters<typeof mocks.toastError>) => mocks.toastError(...args),
    info: (...args: Parameters<typeof mocks.toastInfo>) => mocks.toastInfo(...args),
  },
}));

import { usePeachtreeSync, MAX_SYNC_POLL_ATTEMPTS } from './usePeachtreeSync';
import type { ReviewEntry, LogEntry, ReviewSummary, ReviewJob } from './usePeachtreeSync';

function mockLoadData(
  overrides: {
    tables?: string[];
    review?: ReviewEntry[];
    logs?: LogEntry[];
    summary?: ReviewSummary;
    job?: { running: boolean; job: ReviewJob | null };
  } = {},
) {
  mocks.fetchWithAuth
    .mockResolvedValueOnce({ running: false, percentComplete: 0, currentEntity: '', status: 'idle' })
    .mockResolvedValueOnce([{ id: 'sync1', status: 'completed' }])
    .mockResolvedValueOnce({ dsn: 'mos' })
    .mockResolvedValueOnce(overrides.tables ?? ['Chart', 'Customers'])
    .mockResolvedValueOnce(overrides.review ?? [])
    .mockResolvedValueOnce(overrides.logs ?? [])
    // loadData also fetches the bulk-review summary and any running job, so a
    // refresh resumes an in-flight job. These stay last to keep the ordering
    // of the original five calls untouched.
    .mockResolvedValueOnce(overrides.summary ?? { total: 0, byEntity: [] })
    .mockResolvedValueOnce(overrides.job ?? { running: false, job: null });
}

beforeEach(() => {
  Storage.prototype.getItem = vi.fn((key: string) =>
    key === 'token' ? 'test-token' : null,
  );
  mocks.fetchWithAuth.mockReset();
  mocks.toastSuccess.mockClear();
  mocks.toastError.mockClear();
  mocks.toastInfo.mockClear();
  mocks.push.mockClear();
});

describe('usePeachtreeSync', () => {
  describe('initial state', () => {
    it('starts with loading=true and empty data', () => {
      mockLoadData();
      const { result } = renderHook(() => usePeachtreeSync());
      expect(result.current.loading).toBe(true);
      expect(result.current.connected).toBeNull();
      expect(result.current.history).toEqual([]);
      expect(result.current.tables).toEqual([]);
    });

    it('redirects to /login when no token', async () => {
      Storage.prototype.getItem = vi.fn(() => null);
      renderHook(() => usePeachtreeSync());
      await waitFor(() => {
        expect(mocks.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('loadData', () => {
    it('loads history, config, and tables on mount', async () => {
      mockLoadData({ tables: ['Chart', 'Customers', 'Vendors'] });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.history).toEqual([{ id: 'sync1', status: 'completed' }]);
      expect(result.current.dsn).toBe('mos');
      expect(result.current.tables).toEqual(['Chart', 'Customers', 'Vendors']);
    });

    it('sets empty arrays when APIs return null', async () => {
      mocks.fetchWithAuth
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ dsn: '' })
        .mockResolvedValueOnce(null);
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.history).toEqual([]);
      expect(result.current.tables).toEqual([]);
    });

    it('shows toast error on loadData failure', async () => {
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('network'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mocks.toastError).toHaveBeenCalledWith('فشل تحميل بيانات المزامنة');
    });

    it('handles tables API failure gracefully', async () => {
      mocks.fetchWithAuth
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ dsn: 'mos' })
        .mockRejectedValueOnce(new Error('tables fail'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.tables).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('sets connected=true and shows success toast', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ connected: true });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.testConnection();
      });

      expect(result.current.connected).toBe(true);
      expect(result.current.connectionError).toBe('');
      expect(mocks.toastSuccess).toHaveBeenCalledWith('تم الاتصال بنجاح');
    });

    it('sets connected=false and error on failure response', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ connected: false, error: 'Btrieve Error' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.testConnection();
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.connectionError).toBe('Btrieve Error');
      expect(mocks.toastError).toHaveBeenCalledWith('فشل الاتصال');
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });

    it('handles API exception gracefully', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('network'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.testConnection();
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.connectionError).toBe('حدث خطأ غير متوقع');
      expect(mocks.toastError).toHaveBeenCalledWith('حدث خطأ أثناء الاتصال');
    });

    it('sets testing=false after completion', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ connected: true });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const testingDuring: boolean[] = [];
      const origTest = result.current.testConnection;
      const wrappedTest = async () => {
        testingDuring.push(result.current.testing);
        await origTest();
        testingDuring.push(result.current.testing);
      };

      await act(async () => { await wrappedTest(); });
      expect(testingDuring).toEqual([false, false]);
    });
  });

  describe('runSync', () => {
    it('calls run endpoint and shows success toast on immediate completion', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ message: 'Done', status: 'completed' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.runSync();
      });

      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/run', { method: 'POST', body: JSON.stringify({ mode: 'full' }) });
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Done');
    });

    it('starts polling when status is running', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockLoadData();
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ message: 'Sync started', status: 'running' })
        .mockResolvedValueOnce({ running: true, status: 'running', percentComplete: 50 })
        .mockResolvedValueOnce({ running: false, status: 'completed', percentComplete: 100 });

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.runSync();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(mocks.toastInfo).toHaveBeenCalledWith('بدأت المزامنة في الخلفية...');
      expect(mocks.toastSuccess).toHaveBeenCalledWith('تمت المزامنة بنجاح');
      vi.useRealTimers();
    });

    it('shows error toast when poll returns failed status', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockLoadData();
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ message: 'Sync started', status: 'running' })
        .mockResolvedValueOnce({ running: false, status: 'failed', percentComplete: 100 });

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.runSync();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(mocks.toastError).toHaveBeenCalledWith('فشلت المزامنة — تحقق من السجل');
      vi.useRealTimers();
    });

    it('shows timeout toast after max poll attempts', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockLoadData();
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ message: 'Sync started', status: 'running' });
      for (let i = 0; i < MAX_SYNC_POLL_ATTEMPTS; i++) {
        mocks.fetchWithAuth.mockResolvedValueOnce({ running: true, status: 'running', percentComplete: 50 });
      }

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.runSync();
      });
      for (let i = 0; i < MAX_SYNC_POLL_ATTEMPTS; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000);
        });
      }

      expect(mocks.toastError).toHaveBeenCalledWith('انتهت مهلة الانتظار — المزامنة قد لا تزال تعمل');
      vi.useRealTimers();
    }, 300000);

    it('breaks poll on API error', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockLoadData();
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ message: 'Sync started', status: 'running' })
        .mockRejectedValueOnce(new Error('poll fail'));

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.runSync();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(mocks.toastError).toHaveBeenCalledWith('انتهت مهلة الانتظار — المزامنة قد لا تزال تعمل');
      vi.useRealTimers();
    });

    it('shows failure toast on run endpoint error', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('network'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.runSync();
      });

      expect(mocks.toastError).toHaveBeenCalledWith('فشلت المزامنة');
    });

    it('sets syncing=false after completion', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ message: 'Done', status: 'completed' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.runSync();
      });

      expect(result.current.syncing).toBe(false);
    });
  });

  describe('resyncItems', () => {
    it('fires resync and shows info toast when running', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running', message: 'Resync started' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Mock poll to complete immediately
      mocks.fetchWithAuth.mockResolvedValueOnce({ running: false, status: 'completed', percentComplete: 100 });

      await act(async () => {
        await result.current.resyncItems();
      });

      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/resync-items', { method: 'POST' });
      expect(mocks.toastInfo).toHaveBeenCalledWith('بدأت إعادة مزامنة الأصناف في الخلفية...');
    });

    it('shows success toast when completed via poll', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running' });

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mocks.fetchWithAuth.mockResolvedValueOnce({ running: false, status: 'completed', percentComplete: 100 });

      await act(async () => {
        await result.current.resyncItems();
      });

      expect(mocks.toastSuccess).toHaveBeenCalledWith('تمت المزامنة بنجاح');
    });

    it('shows error toast on poll failure', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running' });

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mocks.fetchWithAuth.mockResolvedValueOnce({ running: false, status: 'failed', percentComplete: 100 });

      await act(async () => {
        await result.current.resyncItems();
      });

      expect(mocks.toastError).toHaveBeenCalledWith('فشلت المزامنة — تحقق من السجل');
    });

    it('shows error toast on failure', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.resyncItems();
      });

      expect(mocks.toastError).toHaveBeenCalledWith('فشل إعادة مزامنة الأصناف');
    });

    it('sets resyncing=false after completion', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mocks.fetchWithAuth.mockResolvedValueOnce({ running: false, status: 'completed', percentComplete: 100 });

      await act(async () => {
        await result.current.resyncItems();
      });

      expect(result.current.resyncing).toBe(false);
    });
  });

  describe('saveConfig', () => {
    it('calls PUT config endpoint with current dsn', async () => {
      mockLoadData();
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.setDsn('mydb'); });

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/config', {
        method: 'PUT',
        body: JSON.stringify({ dsn: 'mydb' }),
      });
      expect(mocks.toastSuccess).toHaveBeenCalledWith('تم حفظ الإعدادات');
    });

    it('shows error toast on failure', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.saveConfig();
      });

      expect(mocks.toastError).toHaveBeenCalledWith('حدث خطأ');
    });
  });

  describe('setDsn', () => {
    it('updates dsn state', async () => {
      mockLoadData();
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.setDsn('new-dsn'); });
      expect(result.current.dsn).toBe('new-dsn');
    });
  });

  describe('review workflow', () => {
    it('previewSync calls the preview endpoint and reloads', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.previewSync(); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/preview', { method: 'POST' });
    }, 10000);

    it('applyReview posts selected ids', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ applied: 2, errors: [] });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.applyReview([1, 2]); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/apply', { method: 'POST', body: JSON.stringify({ ids: [1, 2] }) });
      expect(mocks.toastSuccess).toHaveBeenCalledWith('تم تطبيق 2 تغيير');
    });

    it('skipReview posts selected ids', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ skipped: 1 });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.skipReview([3]); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/skip', { method: 'POST', body: JSON.stringify({ ids: [3] }) });
    });

    it('loads review and logs on mount', async () => {
      mockLoadData({
        review: [{ id: '1', entity: 'customers', record_key: 'Acme', change_type: 'insert', old_values: null, new_values: {} }],
        logs: [{ id: '9', run_id: 'sync_1', entity: 'products', action: 'inserted' }],
      });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.review).toEqual([{ id: '1', entity: 'customers', record_key: 'Acme', change_type: 'insert', old_values: null, new_values: {} }]);
      expect(result.current.logs).toEqual([{ id: '9', run_id: 'sync_1', entity: 'products', action: 'inserted' }]);
    });
  });

  describe('bulk review job', () => {
    const summary: ReviewSummary = {
      total: 300,
      byEntity: [
        { entity: 'customers', count: 60 },
        { entity: 'products', count: 60 },
      ],
    };
    const runningJob: ReviewJob = {
      id: 'revjob_1', action: 'apply', status: 'running', startedAt: '2026-01-01T00:00:00.000Z',
      total: 300, done: 45, applied: 45, skipped: 0, failed: 0,
      percentComplete: 15, currentEntity: 'customers', currentRecordKey: 'E2E-45', errors: [],
    };

    it('loads the pending summary on mount', async () => {
      mockLoadData({ summary });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.pendingSummary).toEqual(summary);
    });

    it('resumes a job that is already running server-side after a refresh', async () => {
      mockLoadData({ job: { running: true, job: runningJob } });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.reviewJobRunning).toBe(true);
      expect(result.current.reviewJob).toEqual(runningJob);
    });

    it('stays idle when no job is running', async () => {
      mockLoadData({ job: { running: false, job: null } });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.reviewJobRunning).toBe(false);
      expect(result.current.reviewJob).toBeNull();
    });

    it('startReviewJob("apply") posts apply-all and adopts the returned job', async () => {
      mockLoadData({ summary });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      mocks.fetchWithAuth.mockResolvedValueOnce(runningJob);

      await act(async () => { await result.current.startReviewJob('apply'); });

      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/apply-all', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result.current.reviewJob).toEqual(runningJob);
    });

    it('startReviewJob("skip") posts skip-all', async () => {
      mockLoadData({ summary });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      mocks.fetchWithAuth.mockResolvedValueOnce(runningJob);

      await act(async () => { await result.current.startReviewJob('skip'); });

      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/skip-all', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    });

    it('clears job state and toasts when the job cannot start', async () => {
      mockLoadData({ summary });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('boom'));

      await act(async () => { await result.current.startReviewJob('apply'); });

      expect(result.current.reviewJobRunning).toBe(false);
      expect(result.current.reviewJob).toBeNull();
      expect(mocks.toastError).toHaveBeenCalledWith('فشل بدء عملية القبول');
    });

    it('leaves the summary unknown when the summary endpoint fails', async () => {
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ running: false, percentComplete: 0, currentEntity: '', status: 'idle' })
        .mockResolvedValueOnce([{ id: 'sync1', status: 'completed' }])
        .mockResolvedValueOnce({ dsn: 'mos' })
        .mockResolvedValueOnce(['Chart'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('summary down'))
        .mockResolvedValueOnce({ running: false, job: null });

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // The rest of the page still loads, and the unknown count is left as
      // null so the page can block the bulk buttons rather than lie about it.
      expect(result.current.tables).toEqual(['Chart']);
      expect(result.current.pendingSummary).toBeNull();
      expect(mocks.toastError).not.toHaveBeenCalled();
    });
  });
});

  describe('polling and reload robustness', () => {
    const staleSummary: ReviewSummary = { total: 300, byEntity: [{ entity: 'customers', count: 300 }] };
    const liveJob: ReviewJob = {
      id: 'revjob_9', action: 'apply', status: 'running', startedAt: '2026-01-01T00:00:00.000Z',
      total: 100, done: 10, applied: 10, skipped: 0, failed: 0,
      percentComplete: 10, currentEntity: 'customers', currentRecordKey: 'C-9', errors: [],
    };
    it('keeps polling through a transient poll failure without touching state', async () => {
      mockLoadData({ job: { running: true, job: liveJob } });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.reviewJobRunning).toBe(true);
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('blip'));
      let stillPolling = false;
      await act(async () => { stillPolling = await result.current.pollReviewJob(); });
      expect(stillPolling).toBe(true);
      expect(result.current.reviewJobRunning).toBe(true);
      expect(mocks.toastError).not.toHaveBeenCalled();
    });

    it('gives up after a sustained poll outage and tells the user', async () => {
      mockLoadData();
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      for (let i = 0; i < 9; i++) {
        mocks.fetchWithAuth.mockRejectedValueOnce(new Error('down'));
        let keepGoing = false;
        await act(async () => { keepGoing = await result.current.pollReviewJob(); });
        expect(keepGoing).toBe(true);
      }
      expect(mocks.toastError).not.toHaveBeenCalled();
      mocks.fetchWithAuth.mockRejectedValueOnce(new Error('down'));
      let keepGoing = true;
      await act(async () => { keepGoing = await result.current.pollReviewJob(); });
      expect(keepGoing).toBe(false);
      expect(result.current.reviewJobRunning).toBe(false);
      expect(mocks.toastError).toHaveBeenCalledWith(
        'انقطع الاتصال أثناء متابعة العملية — أعد تحميل الصفحة للمتابعة',
      );
    });

    it('clears a stale summary when a reload fails', async () => {
      mockLoadData({ summary: staleSummary });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.pendingSummary).toEqual(staleSummary);
      mocks.fetchWithAuth
        .mockResolvedValueOnce({ applied: 1, errors: [] })
        .mockRejectedValueOnce(new Error('reload down'));
      await act(async () => { await result.current.applyReview([1]); });
      expect(result.current.pendingSummary).toBeNull();
    });

    it('shows an error toast when the connection test reports failure', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ connected: false, error: 'nope' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.testConnection(); });
      expect(result.current.connected).toBe(false);
      expect(mocks.toastError).toHaveBeenCalledWith('فشل الاتصال');
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });
  });
