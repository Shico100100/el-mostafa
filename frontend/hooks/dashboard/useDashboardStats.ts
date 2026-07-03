'use client';

import { useState, useEffect } from 'react';
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

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.fetchWithAuth<DashboardStats>('/dashboard/stats').then((data) => {
      if (data) setStats(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
