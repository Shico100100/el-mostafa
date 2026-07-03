'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { normalizeType } from '@/components/inventory2/types';
import type { Product, StockMovement, SemiFinishedProduct } from '@/components/inventory2/types';

export const UI_TYPES = ['FINISHED', 'IMPORTED', 'RAW', 'PACKAGING', 'SEMI'] as const;
export type UiType = (typeof UI_TYPES)[number];

export interface TypeStats {
  type: UiType;
  count: number;
  totalStock: number;
  totalValue: number;
}

export function useInventory2Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [semiFinished, setSemiFinished] = useState<SemiFinishedProduct[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allProducts, sfProducts, movements] = await Promise.all([
          api.fetchWithAuth<Product[]>('/inventory/products').catch(() => []),
          api.fetchWithAuth<SemiFinishedProduct[]>('/inventory/products?type=SEMI_FINISHED').catch(() => []),
          api.fetchWithAuth<StockMovement[]>('/inventory/stock/movements').catch(() => []),
        ]);
        setProducts(allProducts || []);
        setSemiFinished(Array.isArray(sfProducts) ? sfProducts : (sfProducts as Record<string, unknown>)?.data as SemiFinishedProduct[] ?? []);
        setRecentMovements((movements || []).slice(0, 6));
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const typeStats: TypeStats[] = UI_TYPES.map((type) => {
    const filtered = products.filter((p) => normalizeType(p.type) === type);
    const totalStock = filtered.reduce((s, p) => s + Number(p.stock_quantity), 0);
    const totalValue = filtered.reduce((s, p) => {
      if (type === 'FINISHED') return s + Number(p.selling_price) * Number(p.stock_quantity);
      if (p.type === 'IMPORTED' || p.type === 'PACKAGING' || p.type === 'RAW_PLASTIC') return s;
      return s + Number(p.cost_price) * Number(p.stock_quantity);
    }, 0);
    return { type, count: filtered.length, totalStock, totalValue };
  });

  const totalProducts = products.length;
  const totalStockAll = products.reduce((s, p) => s + Number(p.stock_quantity), 0);
  const sfTotalValue = semiFinished.reduce((s, p) => s + Number(p.cost_price) * Number(p.stock_quantity), 0);
  const sfTotalStock = semiFinished.reduce((s, p) => s + Number(p.stock_quantity), 0);
  const inStock = products.filter((p) => Number(p.stock_quantity) > 10).length;
  const lowStockCount = products.filter((p) => { const q = Number(p.stock_quantity); return q > 0 && q <= 10; }).length;
  const outOfStockCount = products.filter((p) => Number(p.stock_quantity) === 0).length;
  const maxCount = Math.max(...typeStats.map((s) => s.count), 1);
  const total = inStock + lowStockCount + outOfStockCount || 1;
  const sfTop = semiFinished.slice(0, 4);
  const sfMaxValue = Math.max(...sfTop.map((p) => Number(p.cost_price) * Number(p.stock_quantity)), 1);

  return {
    products, semiFinished, recentMovements, loading, typeStats, totalProducts, totalStockAll,
    sfTotalValue, sfTotalStock, inStock, lowStockCount, outOfStockCount, maxCount, total,
    sfTop, sfMaxValue,
  };
}
