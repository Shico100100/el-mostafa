'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { RawMaterial } from '@/components/manufacturing/raw-materials/types';

export function useRawMaterials() {
  const router = useRouter();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [formData, setFormData] = useState({ name: '', unit: 'kg', reorder_point: '' });

  const fetchRawMaterials = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth('/manufacturing/raw-materials');
      setRawMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      setRawMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRawMaterials(); }, [fetchRawMaterials]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMaterials = [...rawMaterials].sort((a, b) => {
    if (!sortConfig) return 0;
    let aValue: string | number = 0;
    let bValue: string | number = 0;
    if (sortConfig.key === 'name') { aValue = a.product.name; bValue = b.product.name; }
    else if (sortConfig.key === 'current_stock') { aValue = Number(a.current_stock); bValue = Number(b.current_stock); }
    else if (sortConfig.key === 'reorder_point') { aValue = Number(a.reorder_point); bValue = Number(b.reorder_point); }
    else if (sortConfig.key === 'cost_price') { aValue = Number(a.last_purchase_price || 0); bValue = Number(b.last_purchase_price || 0); }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDelete = async (id: number) => {
    try {
      await api.fetchWithAuth(`/manufacturing/raw-materials/${id}`, { method: 'DELETE' });
      toast.success('تم الحذف بنجاح');
      fetchRawMaterials();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleEdit = (rm: RawMaterial) => {
    setEditingId(rm.id);
    setIsEditing(true);
    setFormData({ name: rm.product.name, unit: rm.product.unit, reorder_point: rm.reorder_point.toString() });
    setShowAddDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        const currentRM = rawMaterials.find(rm => rm.id === editingId);
        if (!currentRM) return;
        await api.fetchWithAuth(`/inventory/products/${currentRM.product.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formData.name, unit: formData.unit }),
        });
        await api.fetchWithAuth(`/manufacturing/raw-materials/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ reorder_point: parseFloat(formData.reorder_point) || 0 }),
        });
        setShowAddDialog(false);
        setFormData({ name: '', unit: 'kg', reorder_point: '' });
        setIsEditing(false);
        setEditingId(null);
        fetchRawMaterials();
        toast.success('تم التعديل بنجاح');
      } else {
        const product = await api.fetchWithAuth('/inventory/products', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name, sku: null, unit: formData.unit, cost_price: 0,
            selling_price: 0, type: 'RAW', description: null, warehouse_id: 6,
          }),
        });
        await api.fetchWithAuth('/manufacturing/raw-materials', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product.id, reorder_point: parseFloat(formData.reorder_point) || 0,
            reorder_quantity: 0, preferred_supplier_id: null, notes: null,
          }),
        });
        setShowAddDialog(false);
        setFormData({ name: '', unit: 'kg', reorder_point: '' });
        setIsEditing(false);
        setEditingId(null);
        fetchRawMaterials();
      }
    } catch {
      toast.error('حدث خطأ أثناء العملية');
    }
  };

  const openAddDialog = () => {
    setFormData({ name: '', unit: 'kg', reorder_point: '' });
    setIsEditing(false);
    setEditingId(null);
    setShowAddDialog(true);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'LOW_STOCK': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'OUT_OF_STOCK': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-[#ecfdf5]0/20 text-gray-400 border-[#ecfdf5]0/30';
    }
  };
  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'عادي';
      case 'LOW_STOCK': return 'منخفض';
      case 'OUT_OF_STOCK': return 'نفذ';
      default: return status;
    }
  };

  const stats = {
    total: rawMaterials.length,
    lowStock: rawMaterials.filter((rm) => rm.stock_status === 'LOW_STOCK').length,
    outOfStock: rawMaterials.filter((rm) => rm.stock_status === 'OUT_OF_STOCK').length,
    totalValue: rawMaterials.reduce((sum, rm) => sum + (rm.current_stock * (rm.last_purchase_price || rm.product.cost_price)), 0),
  };

  return {
    rawMaterials, loading, showAddDialog, setShowAddDialog, isEditing, editingId,
    sortConfig, formData, setFormData, setIsEditing, setEditingId,
    sortedMaterials, stats, fetchRawMaterials,
    handleSort, handleDelete, handleEdit, handleSubmit, openAddDialog,
    getStockStatusColor, getStockStatusText, router,
  };
}
