'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Product } from '@/components/inventory2/bulk-prices/types';

export function useBulkPrices() {
  const ready = useAuthCheck();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [priceField, setPriceField] = useState<'cost_price' | 'selling_price'>('selling_price');
  const [updateType, setUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth<Product[]>('/inventory/products');
      setProducts(data || []);
    } catch {
      toast.error('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadProducts();
  }, [ready, loadProducts]);

  const filtered = useMemo(() =>
    products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && typeFilter === 'RAW') {
        if (p.type !== 'RAW' && p.type !== 'RAW_PLASTIC') return false;
      } else if (typeFilter && p.type !== typeFilter) return false;
      return true;
    }),
    [products, search, typeFilter],
  );

  useEffect(() => {
    if (selectAll) {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [selectAll, filtered]);

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSelectAll(false);
  };

  const handleApply = async () => {
    if (selectedIds.size === 0) { toast.error('اختر منتجاً واحداً على الأقل'); return; }
    const numVal = Number(value);
    if (!numVal || numVal <= 0) { toast.error('أدخل قيمة صحيحة'); return; }
    if (updateType === 'percentage' && numVal > 1000) { toast.error('النسبة يجب أن تكون أقل من 1000%'); return; }

    setSaving(true);
    try {
      await api.fetchWithAuth('/inventory/products/bulk-update-prices', {
        method: 'POST',
        body: JSON.stringify({ productIds: [...selectedIds], priceField, updateType, value: numVal }),
      });
      toast.success(`تم تحديث أسعار ${selectedIds.size} منتج`);
      setSelectedIds(new Set());
      loadProducts();
    } catch {
      toast.error('فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  return {
    products, loading, search, setSearch, typeFilter, setTypeFilter,
    selectedIds, selectAll, setSelectAll,
    priceField, setPriceField, updateType, setUpdateType,
    value, setValue, saving,
    filtered, toggleProduct, handleApply,
  };
}
