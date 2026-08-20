'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { StockItem, WarehouseOption } from '@/components/inventory/stock/types';

export function useStock() {
  const ready = useAuthCheck();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferItem, setTransferItem] = useState<StockItem | null>(null);
  const [transferForm, setTransferForm] = useState({ toWarehouseId: '', notes: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, warehousesData] = await Promise.all([
        api.fetchWithAuth<StockItem[]>(`/inventory/stock${selectedWarehouse ? `?warehouse_id=${selectedWarehouse}` : ''}`),
        api.fetchWithAuth<WarehouseOption[]>('/inventory/warehouses'),
      ]);
      setStock(stockData || []);
      setWarehouses(warehousesData || []);
    } catch { toast.error('فشل تحميل المخزون'); }
    finally { setLoading(false); }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const filteredStock = stock.filter((item) => {
    const name = item.product?.name || '';
    const sku = item.product?.sku || '';
    const type = item.product?.type || '';
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedType && selectedType === 'RAW') {
      if (type !== 'RAW' && type !== 'RAW_PLASTIC') return false;
    } else if (selectedType && type !== selectedType) return false;
    return true;
  });

  const totalItems = filteredStock.reduce((sum, s) => sum + Number(s.quantity), 0);
  const activeCount = filteredStock.filter((s) => Number(s.quantity) > 0).length;

  const openTransfer = (item: StockItem) => {
    setTransferItem(item);
    const other = warehouses.filter((w) => w.id !== item.warehouse_id);
    setTransferForm({ toWarehouseId: other[0]?.id?.toString() || '', notes: '' });
    setShowTransfer(true);
  };

  const handleTransfer = async () => {
    if (!transferItem || !transferForm.toWarehouseId) { toast.error('الرجاء اختيار المخزن الوجهة'); return; }
    try {
      await api.fetchWithAuth('/inventory/stock/transfer', {
        method: 'POST',
        body: JSON.stringify({
          product_id: transferItem.product_id,
          from_warehouse_id: transferItem.warehouse_id,
          to_warehouse_id: parseInt(transferForm.toWarehouseId),
          notes: transferForm.notes || `نقل ${transferItem.product?.name}`,
        }),
      });
      toast.success(`تم نقل "${transferItem.product?.name}" بنجاح`);
      setShowTransfer(false);
      loadData();
    } catch { toast.error('فشل نقل المنتج'); }
  };

  return {
    stock, filteredStock, warehouses, loading, selectedWarehouse, selectedType, search,
    showTransfer, transferItem, transferForm,
    totalItems, activeCount,
    setSelectedWarehouse, setSelectedType, setSearch,
    setShowTransfer, setTransferItem, setTransferForm,
    openTransfer, handleTransfer, loadData,
  };
}
