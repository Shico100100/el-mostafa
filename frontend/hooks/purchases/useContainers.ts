'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Container, CbmResult } from '@/components/purchases/containers/types';

export function useContainers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [cbmLength, setCbmLength] = useState('');
  const [cbmWidth, setCbmWidth] = useState('');
  const [cbmHeight, setCbmHeight] = useState('');
  const [cbmCartons, setCbmCartons] = useState('1');
  const [cbmResult, setCbmResult] = useState<CbmResult | null>(null);
  const [cbmCalculating, setCbmCalculating] = useState(false);
  const [reorderContainerId, setReorderContainerId] = useState('');
  const [reorderResults, setReorderResults] = useState<Record<string, unknown> | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [form, setForm] = useState({ name: '', length_cm: '', width_cm: '', height_cm: '', max_weight_kg: '', notes: '' });

  const loadData = useCallback(async () => {
    try {
      const data = await api.getContainers();
      setContainers(data || []);
    } catch (error) {
      console.error('Failed to load containers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => setForm({ name: '', length_cm: '', width_cm: '', height_cm: '', max_weight_kg: '', notes: '' });

  const openEdit = (c: Container) => {
    setSelectedContainer(c);
    setForm({ name: c.name, length_cm: String(c.length_cm), width_cm: String(c.width_cm), height_cm: String(c.height_cm), max_weight_kg: String(c.max_weight_kg), notes: c.notes || '' });
    setShowEditDialog(true);
  };

  const handleSave = async (isEdit: boolean) => {
    try {
      const payload = {
        name: form.name, length_cm: Number(form.length_cm), width_cm: Number(form.width_cm),
        height_cm: Number(form.height_cm), max_weight_kg: Number(form.max_weight_kg), notes: form.notes || undefined,
      };
      if (isEdit && selectedContainer) {
        await api.updateContainer(selectedContainer.id, payload);
      } else {
        await api.createContainer(payload);
      }
      setShowAddDialog(false);
      setShowEditDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save container:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteContainer(id);
      loadData();
      toast.success('تم حذف الحاوية');
    } catch {
      toast.error('فشل حذف الحاوية');
    }
  };

  const handleCalculateCBM = async () => {
    setCbmCalculating(true);
    try {
      const result = await api.calculateCBM(Number(cbmLength), Number(cbmWidth), Number(cbmHeight), Number(cbmCartons));
      setCbmResult(result);
    } catch (error) {
      console.error('CBM calculation failed:', error);
    } finally {
      setCbmCalculating(false);
    }
  };

  const handleReorderSuggestions = async () => {
    if (!reorderContainerId) return;
    setReorderLoading(true);
    try {
      const result = await api.getReorderSuggestions(+reorderContainerId);
      setReorderResults(result);
    } catch (error) {
      console.error('Reorder suggestions failed:', error);
    } finally {
      setReorderLoading(false);
    }
  };

  return {
    containers, loading, cbmLength, setCbmLength, cbmWidth, setCbmWidth, cbmHeight, setCbmHeight,
    cbmCartons, setCbmCartons, cbmResult, cbmCalculating,
    reorderContainerId, setReorderContainerId, reorderResults, reorderLoading,
    showAddDialog, setShowAddDialog, showEditDialog, setShowEditDialog,
    selectedContainer, form, setForm, resetForm,
    openEdit, handleSave, handleDelete, handleCalculateCBM, handleReorderSuggestions, loadData,
  };
}
