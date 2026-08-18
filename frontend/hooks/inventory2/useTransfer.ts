'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Product, WarehouseItem, StockItem } from '@/components/inventory2/transfer/types';

export function useTransfer() {
  const ready = useAuthCheck();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState(0);
  const [fromWarehouseId, setFromWarehouseId] = useState(0);
  const [toWarehouseId, setToWarehouseId] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, whs, stock] = await Promise.all([
        api.fetchWithAuth<Product[]>('/inventory/products'),
        api.fetchWithAuth<WarehouseItem[]>('/inventory/warehouses'),
        api.fetchWithAuth<StockItem[]>('/inventory/stock'),
      ]);
      setProducts(prods || []);
      setWarehouses(whs || []);
      setStockItems(stock || []);
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  useEffect(() => {
    if (warehouses.length >= 2) {
      setFromWarehouseId(warehouses[0].id);
      setToWarehouseId(warehouses[1].id);
    }
  }, [warehouses]);

  const availableStock = productId && fromWarehouseId
    ? stockItems.find((s) => s.product_id === productId && s.warehouse_id === fromWarehouseId)
    : null;

  const maxQty = availableStock ? Number(availableStock.quantity) : 0;
  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { toast.error('اختر المنتج'); return; }
    if (fromWarehouseId === toWarehouseId) { toast.error('اختر مخزنين مختلفين'); return; }
    const qty = Number(quantity);
    if (!qty || qty <= 0) { toast.error('أدخل كمية صحيحة'); return; }
    if (qty > maxQty) { toast.error(`الكمية المتاحة: ${maxQty}`); return; }

    setSaving(true);
    try {
      await api.fetchWithAuth('/inventory/stock/transfer', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId,
          quantity: qty,
          notes: notes || undefined,
        }),
      });
      toast.success('تم التحويل بنجاح');
      setQuantity('');
      setNotes('');
      loadData();
    } catch (err) {
      toast.error((err as { message?: string }).message || 'فشل التحويل');
    } finally {
      setSaving(false);
    }
  };

  return {
    products, warehouses, loading, productId, fromWarehouseId, toWarehouseId,
    quantity, notes, saving, maxQty, selectedProduct, availableStock,
    setProductId, setFromWarehouseId, setToWarehouseId, setQuantity, setNotes,
    handleSubmit, loadData,
  };
}
