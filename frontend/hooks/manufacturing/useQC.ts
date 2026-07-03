'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { QCStats, QCInspection, PendingProduction } from '@/components/manufacturing/qc/types';

export function useQC() {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [pending, setPending] = useState<PendingProduction[]>([]);
  const [recent, setRecent] = useState<QCInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedProductionId, setSelectedProductionId] = useState<number | ''>('');
  const [inspectionStatus, setInspectionStatus] = useState<'PASS' | 'FAIL'>('PASS');
  const [defectsCount, setDefectsCount] = useState(0);
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getQCStats().catch(() => null),
      api.getQCPending().catch(() => []),
      api.getQCRecent(50).catch(() => []),
    ])
      .then(([statsData, pendingData, recentData]) => {
        if (statsData) setStats(statsData);
        if (pendingData) setPending(pendingData);
        if (recentData) setRecent(recentData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setSelectedProductionId('');
    setInspectionStatus('PASS');
    setDefectsCount(0);
    setNotes('');
  };

  const filteredRecent = useMemo(() =>
    recent.filter((r) => {
      const matchesSearch = !searchQuery || (r.product?.name || r.production?.mold?.name || r.production?.machine?.name || '')
        .toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [recent, searchQuery, statusFilter],
  );

  const handleCreateInspection = async () => {
    if (!selectedProductionId) return;
    setSaving(true);
    try {
      await api.createQCInspection({
        production_id: selectedProductionId,
        status: inspectionStatus,
        defects_count: defectsCount,
        notes,
      });
      toast.success('تم إنشاء فحص الجودة بنجاح');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch {
      toast.error('فشل إنشاء فحص الجودة');
    } finally {
      setSaving(false);
    }
  };

  return {
    stats, pending, recent, loading,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    showCreateModal, setShowCreateModal, saving,
    selectedProductionId, setSelectedProductionId,
    inspectionStatus, setInspectionStatus,
    defectsCount, setDefectsCount, notes, setNotes,
    filteredRecent, handleCreateInspection, resetForm,
  };
}
