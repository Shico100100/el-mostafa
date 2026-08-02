'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  treasuryBalance: number;
  totalStockValue: number;
  productionCount: number;
  maintenanceOverdueCount: number;
  salesTrend: { date: string; value: number }[];
  attendanceSummary: { present: number; absent: number; late: number; total: number };
  topCustomers: AnyData[];
  topProducts: AnyData[];
  latestSales: AnyData[];
  latestPurchases: AnyData[];
  [key: string]: AnyData;
}

const CACHE_KEY = 'dashboard_stats';
const CACHE_TTL = 120_000; // 2 minutes

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.fetchWithAuth<DashboardStats>('/dashboard/stats');
      if (!mountedRef.current) return;
      if (data) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        setStats(data);
        setLastRefresh(new Date());
      }
    } catch { /* silent */ }
    finally { if (mountedRef.current) setLoading(false); }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setStats(data);
          setLoading(false);
          // Still start auto-refresh even when cache hit
          intervalRef.current = setInterval(() => fetchStats(false), 300_000);
          return () => { mountedRef.current = false; if (intervalRef.current) clearInterval(intervalRef.current); };
        }
      } catch { /* ignore stale cache */ }
    }

    fetchStats();
    intervalRef.current = setInterval(() => fetchStats(false), 300_000);

    return () => { mountedRef.current = false; if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStats]);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchStats(true);
  }, [fetchStats]);

  return { stats, loading, lastRefresh, refresh };
}
