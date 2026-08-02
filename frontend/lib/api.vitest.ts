import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test pure functions by accessing the module's internal logic
// since the `api` object uses module-level state (API_URL)
describe('api module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('normalizeApiUrl', () => {
    it('adds /api suffix when missing', async () => {
      const { getApiUrl, setApiBaseUrl } = await import('./api');
      setApiBaseUrl('http://localhost:3001');
      expect(getApiUrl()).toBe('http://localhost:3001/api');
    });

    it('does not duplicate /api', async () => {
      const { getApiUrl, setApiBaseUrl } = await import('./api');
      setApiBaseUrl('http://localhost:3001/api');
      expect(getApiUrl()).toBe('http://localhost:3001/api');
    });

    it('strips trailing slashes', async () => {
      const { getApiUrl, setApiBaseUrl } = await import('./api');
      setApiBaseUrl('http://localhost:3001///');
      expect(getApiUrl()).toBe('http://localhost:3001/api');
    });

    it('handles empty localStorage gracefully', async () => {
      const { getApiUrl } = await import('./api');
      expect(getApiUrl()).toBe('/api');
    });
  });

  describe('auth functions', () => {
    it('clearAuth removes token and refreshToken', async () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('refreshToken', 'xyz');
      const { api } = await import('./api');
      api.clearAuth();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('tryRefreshToken returns false when no refreshToken', async () => {
      const { api } = await import('./api');
      const result = await api.tryRefreshToken();
      expect(result).toBe(false);
    });
  });

  describe('fetchWithAuth', () => {
    it('adds Bearer token from localStorage', async () => {
      localStorage.setItem('token', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: 'ok' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { api } = await import('./api');
      await api.fetchWithAuth('/v1/users');

      const callUrl = mockFetch.mock.calls[0][0];
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callUrl).toContain('/api/v1/users');
      expect(callHeaders['Authorization']).toBe('Bearer test-token');
      vi.unstubAllGlobals();
    });

    it('adds Content-Type for JSON body', async () => {
      localStorage.setItem('token', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({})),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { api } = await import('./api');
      await api.fetchWithAuth('/v1/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
      vi.unstubAllGlobals();
    });

    it('does not add Content-Type for FormData', async () => {
      localStorage.setItem('token', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({})),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { api } = await import('./api');
      const formData = new FormData();
      formData.append('file', new Blob(['test']));
      await api.fetchWithAuth('/v1/system/restore', {
        method: 'POST',
        body: formData,
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBeUndefined();
      vi.unstubAllGlobals();
    });

    it('throws on non-ok response with error message', async () => {
      localStorage.setItem('token', 'test');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { api } = await import('./api');
      await expect(api.fetchWithAuth('/v1/users')).rejects.toThrow('Bad request');
      vi.unstubAllGlobals();
    });

    it('throws Unauthorized when refresh fails', async () => {
      localStorage.setItem('token', 'expired');
      localStorage.setItem('refreshToken', 'bad-refresh');
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('{}') });

      const { api } = await import('./api');
      await expect(api.fetchWithAuth('/v1/users')).rejects.toThrow('Unauthorized');
    });
  });
});
