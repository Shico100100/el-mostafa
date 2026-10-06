import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi as vitestVi } from 'vitest';

const mocks = vitestVi.hoisted(() => {
  const fetchWithAuth = vi.fn();
  const replace = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  let params = new URLSearchParams('');
  return { fetchWithAuth, replace, toastSuccess, toastError,
    getParams: () => params, setParams: (p: URLSearchParams) => { params = p; } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (...a: unknown[]) => mocks.replace(...a) }),
  useSearchParams: () => mocks.getParams(),
}));

vi.mock('@/lib/useAuthCheck', () => ({ useAuthCheck: () => true }));

vi.mock('@/lib/api', () => ({
  api: { fetchWithAuth: (...a: unknown[]) => (mocks.fetchWithAuth as (...x: unknown[]) => unknown)(...a) },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => (mocks.toastSuccess as (...x: unknown[]) => unknown)(...a),
    error: (...a: unknown[]) => (mocks.toastError as (...x: unknown[]) => unknown)(...a),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { useProducts } from './useProducts';

function mockLoad(products: unknown[] = []) {
  mocks.fetchWithAuth
    .mockResolvedValueOnce({ data: products, total: products.length, totalPages: 1, page: 1 })
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce({ totalProducts: 5, totalValue: 100, lowStockCount: 1 });
}

beforeEach(() => {
  mocks.fetchWithAuth.mockReset();
  mocks.replace.mockClear();
  mocks.toastSuccess.mockClear();
  mocks.toastError.mockClear();
  mocks.setParams(new URLSearchParams(''));
});

describe('useProducts selection', () => {
  const rows = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ];

  it('toggles single rows and the whole page', async () => {
    mockLoad(rows);
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.selectedIds.size).toBe(0);
    await act(async () => { result.current.toggleSelect(1); });
    expect([...result.current.selectedIds]).toEqual([1]);
    await act(async () => { result.current.toggleSelectPage(); });
    expect([...result.current.selectedIds].sort()).toEqual([1, 2]);
    await act(async () => { result.current.toggleSelectPage(); });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('prunes selections whose rows disappeared', async () => {
    mockLoad(rows);
    const { result, rerender } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { result.current.toggleSelect(1); result.current.toggleSelect(2); });
    expect(result.current.selectedIds.size).toBe(2);
    mockLoad([rows[1]]);
    await act(async () => { await result.current.loadData(); });
    rerender();
    expect([...result.current.selectedIds]).toEqual([2]);
  });
});

describe('useProducts url sync', () => {
  it('initializes filters from the url', async () => {
    mocks.setParams(new URLSearchParams('search=abc&type=FINISHED&page=3&low=1'));
    mockLoad([]);
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.page).toBe(3);
    expect(result.current.showLowStock).toBe(true);
    const firstCall = mocks.fetchWithAuth.mock.calls[0][0] as string;
    expect(firstCall).toContain('search=abc');
    expect(firstCall).toContain('type=FINISHED');
    expect(firstCall).toContain('page=3');
  });

  it('writes filter changes back to the url', async () => {
    mockLoad([]);
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.replace.mockClear();
    await act(async () => { result.current.setSearch('xyz'); });
    const last = mocks.replace.mock.calls[mocks.replace.mock.calls.length - 1][0] as string;
    expect(last).toContain('search=xyz');
  });
});

describe('useProducts bulk actions and summary', () => {
  it('loads the global summary alongside the page', async () => {
    mockLoad([]);
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary).toEqual({ totalProducts: 5, totalValue: 100, lowStockCount: 1 });
    const urls = mocks.fetchWithAuth.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/inventory/products/summary'))).toBe(true);
  });

  it('bulk deletes the selection and reloads', async () => {
    mockLoad([{ id: 1 }, { id: 2 }]);
    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { result.current.toggleSelect(1); result.current.toggleSelect(2); });
    mocks.fetchWithAuth.mockResolvedValueOnce({ deleted: 2 });
    mockLoad([]);
    await act(async () => { await result.current.executeBulkDelete(); });
    const delCall = mocks.fetchWithAuth.mock.calls.find((c) => (c[0] as string).includes('bulk-delete'));
    expect(delCall).toBeDefined();
    expect(result.current.selectedIds.size).toBe(0);
  });
});
