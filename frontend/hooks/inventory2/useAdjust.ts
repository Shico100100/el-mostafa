'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Product, WarehouseItem, StockItem } from '@/components/inventory2/adjust/types';

export function useAdjust() {
  const ready = useAuthCheck();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState(0);
  const [warehouseId, setWarehouseId] = useState(0);
  const [newQuantity, setNewQuantity] = useState('');
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
    if (warehouses.length > 0 && warehouseId === 0) setWarehouseId(warehouses[0].id);
  }, [warehouses, warehouseId]);

  const currentStock = productId && warehouseId
    ? (stockItems.find((s) => s.product_id === productId && s.warehouse_id === warehouseId) ?? null) : null;
  const currentQty = currentStock ? Number(currentStock.quantity) : 0;
  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { toast.error('اختر المنتج'); return; }
    if (warehouseId === 0) { toast.error('اختر المخزن'); return; }
    const qty = Number(newQuantity);
    if (isNaN(qty) || qty < 0) { toast.error('أدخل كمية صحيحة (0 أو أكثر)'); return; }

    setSaving(true);
    try {
      await api.fetchWithAuth('/inventory/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, warehouse_id: warehouseId, new_quantity: qty, notes: notes || undefined }),
      });
      toast.success(`تم تعديل الكمية إلى ${qty.toLocaleString()}`);
      setNewQuantity('');
      setNotes('');
      loadData();
    } catch {
      toast.error('فشل التعديل');
    } finally {
      setSaving(false);
    }
  };

  return {
    products, warehouses, loading, productId, warehouseId, newQuantity, notes, saving,
    currentQty, selectedProduct, currentStock,
    setProductId, setWarehouseId, setNewQuantity, setNotes, handleSubmit, loadData,
  };
}
