'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Accessory, HistoryItem, ReportItem, POItem } from '@/components/assembly/accessories/types';

export function useAccessories() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalValue, setTotalValue] = useState({ total_value: 0, count: 0 });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [stockMode, setStockMode] = useState<'UNIT' | 'KG'>('UNIT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showPODialog, setShowPODialog] = useState(false);
  const [reportType, setReportType] = useState<'TOP' | 'SLOW'>('TOP');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [poData, setPoData] = useState<POItem[]>([]);
  const [bulkItems, setBulkItems] = useState<{ id: number; quantity: string; price: string }[]>([{ id: 0, quantity: '', price: '' }]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth('/manufacturing/accessories');
      const sortedData = sortAlphabetically(data || [], (item: Accessory) => item.product.name);
      setAccessories(sortedData);

      const stats = await api.fetchWithAuth('/manufacturing/accessories/stats/total-value');
      setTotalValue(stats);
    } catch (error) {
      console.error('Failed to load accessories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      if (formData.name) {
        data.append('name_translation', JSON.stringify({ ar: formData.name, en: formData.name }));
      }
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      await api.fetchWithAuth('/manufacturing/accessories' + (selectedAccessory ? `/${selectedAccessory.id}` : ''), {
        method: selectedAccessory ? 'PUT' : 'POST',
        body: data,
      });

      setShowAddDialog(false);
      setSelectedFile(null);
      loadData();
      toast.success(selectedAccessory ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleStockOperation = async (type: 'add' | 'consume', e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccessory) return;

    let quantity = Number(formData.quantity);
    if (stockMode === 'KG' && selectedAccessory.weight_per_piece) {
      quantity = Math.round((quantity * 1000) / selectedAccessory.weight_per_piece);
    }

    const url = `/manufacturing/accessories/${selectedAccessory.id}/stock/${type}`;
    try {
      await api.fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({ ...formData, quantity })
      });
      setShowStockDialog(false);
      setShowConsumeDialog(false);
      loadData();
      toast.success('تمت العملية بنجاح');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleHistory = async (acc: Accessory) => {
    try {
      const data = await api.fetchWithAuth(`/manufacturing/accessories/${acc.id}/history`);
      setHistory(data || []);
      setSelectedAccessory(acc);
      setShowHistoryDialog(true);
    } catch {
      toast.error('فشل تحميل السجل');
    }
  };

  const handleReports = async (type: 'TOP' | 'SLOW') => {
    setReportType(type);
    try {
      const endpoint = type === 'TOP'
        ? '/manufacturing/accessories/reports/top-consumed?limit=10'
        : '/manufacturing/accessories/reports/slow-moving?months=3';
      const data = await api.fetchWithAuth(endpoint);
      setReportData(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDraftPO = async () => {
    try {
      const data = await api.fetchWithAuth('/manufacturing/accessories/po/draft');
      setPoData(data || []);
      setShowPODialog(true);
    } catch {
      toast.error('خطأ في إنشاء طلب الشراء');
    }
  };

  const handleBulkSubmit = async () => {
    const validItems = bulkItems.filter(i => i.id && Number(i.quantity) > 0).map(i => ({
      id: Number(i.id),
      quantity: Number(i.quantity),
      price: i.price ? Number(i.price) : undefined
    }));

    if (validItems.length === 0) return;

    try {
      await api.fetchWithAuth('/manufacturing/accessories/stock/bulk', {
        method: 'POST',
        body: JSON.stringify({ items: validItems })
      });
      setShowBulkDialog(false);
      setBulkItems([{ id: 0, quantity: '', price: '' }]);
      loadData();
      toast.success('تم استلام الشحنة بنجاح');
    } catch {
      toast.error('خطأ في العملية');
    }
  };

  const openStockDialog = (acc: Accessory, type: 'add' | 'consume') => {
    setSelectedAccessory(acc);
    setFormData({ quantity: '' });
    setStockMode('UNIT');
    if (type === 'add') setShowStockDialog(true);
    else setShowConsumeDialog(true);
  };

  const openEditDialog = (acc: Accessory) => {
    setSelectedAccessory(acc);
    setFormData({
      name: acc.product.name,
      unit: acc.product.unit,
      reorder_point: String(acc.reorder_point),
      notes: acc.notes || '',
      weight_per_piece: acc.weight_per_piece != null ? String(acc.weight_per_piece) : ''
    });
    setSelectedFile(null);
    setShowAddDialog(true);
  };

  const openAddDialog = () => {
    setSelectedAccessory(null);
    setFormData({});
    setSelectedFile(null);
    setShowAddDialog(true);
  };

  const handleDelete = async (acc: Accessory) => {
    if (!confirm('هل أنت متأكد من حذف هذا الأكسسوار؟')) return;
    try {
      await api.fetchWithAuth(`/manufacturing/accessories/${acc.id}`, { method: 'DELETE' });
      loadData();
      toast.success('تم الحذف بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-500/20 text-green-400';
      case 'LOW_STOCK': return 'bg-yellow-500/20 text-yellow-400';
      case 'OUT_OF_STOCK': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return {
    accessories, loading, totalValue,
    showAddDialog, setShowAddDialog,
    showStockDialog, setShowStockDialog,
    showConsumeDialog, setShowConsumeDialog,
    showHistoryDialog, setShowHistoryDialog,
    showReportsDialog, setShowReportsDialog,
    showBulkDialog, setShowBulkDialog,
    showPODialog, setShowPODialog,
    selectedAccessory, setSelectedAccessory,
    history, formData, setFormData,
    stockMode, setStockMode,
    selectedFile, setSelectedFile,
    reportType, setReportType,
    reportData, poData, bulkItems, setBulkItems,

    handleSave, handleStockOperation,
    handleHistory, handleReports,
    handleDraftPO, handleBulkSubmit,
    openStockDialog, openEditDialog, openAddDialog,
    handleDelete, getStatusColor, loadData,
  };
}
