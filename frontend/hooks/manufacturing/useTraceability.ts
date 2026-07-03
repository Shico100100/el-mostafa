'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Batch } from '@/components/manufacturing/traceability/types';

export function useTraceability() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchBatch, setSearchBatch] = useState('');
  const [traceResults, setTraceResults] = useState<Batch[] | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const data = await api.getBatches(statusFilter || undefined);
      setBatches(data || []);
    } catch (e) {
      console.error('Error loading batches:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const handleForwardTrace = async () => {
    if (!searchBatch.trim()) return;
    try {
      const result = await api.forwardTrace(searchBatch.trim());
      setTraceResults(result.batches || []);
    } catch (e) {
      console.error('Trace error:', e);
      toast.error('فشل التتبع');
    }
  };

  const filtered = traceResults !== null
    ? traceResults
    : batches.filter(b =>
        !filter || b.batch_number.includes(filter) || b.product?.name?.includes(filter)
      );

  return {
    batches, loading, filter, setFilter, statusFilter, setStatusFilter,
    showCreateModal, setShowCreateModal,
    searchBatch, setSearchBatch, traceResults, setTraceResults,
    filtered, loadBatches, handleForwardTrace,
  };
}
