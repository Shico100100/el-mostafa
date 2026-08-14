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

import { usePeachtreeSync } from './usePeachtreeSync';
import type { ReviewEntry, LogEntry } from './usePeachtreeSync';

function mockLoadData(
  overrides: { tables?: string[]; review?: any[]; logs?: any[] } = {},
) {
  mocks.fetchWithAuth
    .mockResolvedValueOnce([{ id: 'sync1', status: 'completed' }])
    .mockResolvedValueOnce({ dsn: 'mos' })
    .mockResolvedValueOnce(overrides.tables ?? ['Chart', 'Customers'])
    .mockResolvedValueOnce(overrides.review ?? [])
    .mockResolvedValueOnce(overrides.logs ?? []);
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
      expect(mocks.toastSuccess).toHaveBeenCalledWith('فشل الاتصال');
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
      for (let i = 0; i < 120; i++) {
        mocks.fetchWithAuth.mockResolvedValueOnce({ running: true, status: 'running', percentComplete: 50 });
      }

      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        result.current.runSync();
      });
      for (let i = 0; i < 120; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000);
        });
      }

      expect(mocks.toastError).toHaveBeenCalledWith('انتهت مهلة الانتظار — المزامنة قد لا تزال تعمل');
      vi.useRealTimers();
    }, 30000);

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
        review: [{ id: 1, entity: 'customers', record_key: 'Acme' }],
        logs: [{ id: 9, run_id: 'sync_1', entity: 'products', action: 'inserted' }],
      });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.review).toEqual([{ id: 1, entity: 'customers', record_key: 'Acme' }]);
      expect(result.current.logs).toEqual([{ id: 9, run_id: 'sync_1', entity: 'products', action: 'inserted' }]);
    });
  });
});
