'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { NormalizedProductionItem } from '@/components/manufacturing/types';

interface StockErrorItem {
  bulkIndex: number;
  normalized: NormalizedProductionItem;
  error: Error;
}

interface StockError {
  items: StockErrorItem[];
}

interface StockCallbacks {
  onClearEditState: () => void;
}

export function useProductionStock(
  date: string,
  fetchData: () => Promise<void>,
  setLoading: (v: boolean) => void,
  callbacks: StockCallbacks,
) {
  const [stockError, setStockError] = useState<StockError | null>(null);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showSubstitutePicker, setShowSubstitutePicker] = useState(false);

  const handleAllowNegativeStock = async () => {
    if (!stockError) return;
    setShowStockDialog(false);
    setLoading(true);
    try {
      await Promise.all(stockError.items.map(({ normalized }) =>
        api.createProduction({
          machine_id: normalized.machine_id!, machine_name: normalized.machine_name,
          mold_id: normalized.mold_id!, product_id: normalized.product_id!,
          total_production_kg: normalized.total_production_kg!,
          hours_worked: normalized.hours_worked ?? 8, notes: normalized.notes,
          date: date, allow_negative_stock: true,
        })));
      setStockError(null);
      callbacks.onClearEditState();
      toast.success('تم الحفظ بالرصيد السالب');
      fetchData();
    } catch (error) {
      console.error('Failed to save with negative stock:', error);
      toast.error('حدث خطأ أثناء الحفظ بالرصيد السالب');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubstitutePicker = () => {
    setShowStockDialog(false);
    setShowSubstitutePicker(true);
  };

  const handleSubstituteMaterial = async (newMaterialId: number) => {
    if (!stockError) return;
    setShowSubstitutePicker(false);
    setLoading(true);
    try {
      await Promise.all(stockError.items.map(({ normalized }) =>
        api.createProduction({
          machine_id: normalized.machine_id!, machine_name: normalized.machine_name,
          mold_id: normalized.mold_id!, product_id: normalized.product_id!,
          substitute_material_id: newMaterialId,
          total_production_kg: normalized.total_production_kg!,
          hours_worked: normalized.hours_worked ?? 8, notes: normalized.notes, date: date,
        })));
      setStockError(null);
      callbacks.onClearEditState();
      toast.success('تم الحفظ بالمادة البديلة');
      fetchData();
    } catch (error) {
      console.error('Failed to save with substitute:', error);
      toast.error('حدث خطأ أثناء الحفظ بالمادة البديلة');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelStockAction = () => {
    setShowStockDialog(false);
    setStockError(null);
  };

  const triggerStockError = (items: StockErrorItem[]) => {
    setStockError({ items });
    setShowStockDialog(true);
  };

  return {
    stockError, showStockDialog, showSubstitutePicker,
    setStockError, setShowStockDialog, setShowSubstitutePicker,
    handleAllowNegativeStock, handleOpenSubstitutePicker,
    handleSubstituteMaterial, handleCancelStockAction,
    triggerStockError,
  };
}
