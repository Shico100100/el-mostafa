import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthCheck } from './useAuthCheck';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useAuthCheck', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false initially before useEffect runs', () => {
    const { result } = renderHook(() => useAuthCheck());
    expect(result.current).toBe(false);
  });

  it('returns true when token exists', async () => {
    localStorage.setItem('token', 'valid-token');
    const { result } = renderHook(() => useAuthCheck());
    await vi.advanceTimersByTimeAsync(100);
    expect(result.current).toBe(true);
  });

  it('returns false when no token', async () => {
    const { result } = renderHook(() => useAuthCheck());
    await vi.advanceTimersByTimeAsync(100);
    expect(result.current).toBe(false);
  });

  it('redirects to /login when no token', async () => {
    const { result } = renderHook(() => useAuthCheck());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(result.current).toBe(false);
  });

  it('does not redirect when token exists', async () => {
    localStorage.setItem('token', 'valid-token');
    renderHook(() => useAuthCheck());
    await vi.advanceTimersByTimeAsync(100);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
