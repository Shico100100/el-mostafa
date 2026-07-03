'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Consumption, ConsumptionStats } from '@/components/manufacturing/consumption/types';

export function useConsumption() {
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchConsumptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const qs = params.toString();
      const data = await api.fetchWithAuth(`/v1/manufacturing/raw-materials/consumption/history${qs ? `?${qs}` : ''}`);
      setConsumptions(data || []);
    } catch (err) {
      console.error('Error fetching consumptions:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchConsumptions(); }, [fetchConsumptions]);

  const stats: ConsumptionStats = {
    totalConsumptions: consumptions.length,
    totalCost: consumptions.reduce((s, c) => s + Number(c.total_cost), 0),
    totalQuantity: consumptions.reduce((s, c) => s + Number(c.quantity), 0),
  };

  return { consumptions, loading, startDate, endDate, setStartDate, setEndDate, fetchConsumptions, stats };
}
