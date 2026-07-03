'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Trend {
  month: string;
  sales: number;
  purchases: number;
  production: number;
}

interface InventoryValue {
  [key: string]: unknown;
  name: string;
  value: number;
}

interface Stats {
  totalValue: number;
  productCount: number;
  lowStockItems: unknown[];
}

export function useControlTower() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [inventoryValue, setInventoryValue] = useState<InventoryValue[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendsData, invValueData, stockData] = await Promise.all([
        api.getTrends(),
        api.getInventoryValueReport(),
        api.getStockReport()
      ]);
      setTrends(trendsData);
      setInventoryValue(invValueData);
      setStats(stockData);
    } catch (err) {
      console.error('Failed to load control tower data:', err);
    } finally { setLoading(false); }
  };

  return { trends, inventoryValue, stats, loading };
}
