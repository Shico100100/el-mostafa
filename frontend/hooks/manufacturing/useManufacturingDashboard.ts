'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface ManufacturingStats {
  activeMachines: number;
  dailyProductionOrders: number;
  usedMoldsCount: number;
}

export function useManufacturingDashboard() {
  const [stats, setStats] = useState<ManufacturingStats>({
    activeMachines: 0, dailyProductionOrders: 0, usedMoldsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getManufacturingStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch manufacturing stats:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading };
}
