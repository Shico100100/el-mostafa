'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { StockMovement } from '@/components/inventory2/types';

export function useMovements() {
  const ready = useAuthCheck();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth<StockMovement[]>('/inventory/stock/movements');
      setMovements(data || []);
    } catch {
      toast.error('فشل تحميل الحركات');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const filtered = movements.filter((m) => {
    if (search) {
      const name = m.product?.name || `#${m.product_id}`;
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (typeFilter && m.type !== typeFilter) return false;
    return true;
  });

  const inCount = filtered.filter((m) => m.type === 'IN').length;
  const outCount = filtered.filter((m) => m.type === 'OUT').length;
  const adjCount = filtered.filter((m) => m.type === 'ADJUST').length;

  return { movements, loading, search, setSearch, typeFilter, setTypeFilter, filtered, inCount, outCount, adjCount, loadData };
}
