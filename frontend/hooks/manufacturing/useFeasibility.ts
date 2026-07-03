'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Product, FeasibilityReport, ProductionHistoryData, ProductionItem } from '@/components/manufacturing/feasibility/types';

export function useFeasibility() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<{ value: number; label: string }[]>([]);
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [report, setReport] = useState<FeasibilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [historyModal, setHistoryModal] = useState<{ visible: boolean; productId: number; productName: string; data: ProductionHistoryData | null }>({ visible: false, productId: 0, productName: '', data: null });

  useEffect(() => {
    api.getProducts('FINISHED').then((data: Product[]) => {
      setProducts(data || []);
      setProductOptions((data || []).map((p) => ({ value: p.id, label: `${p.name} (${p.unit})` })));
    }).catch(console.error);
  }, []);

  const addItem = () => setProductionItems([...productionItems, { productId: 0, quantity: '' }]);
  const removeItem = (index: number) => setProductionItems(productionItems.filter((_, i) => i !== index));
  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setProductionItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const analyze = useCallback(async () => {
    const items = productionItems.filter((i) => i.productId && i.quantity).map((i) => ({ productId: i.productId, quantity: Number(i.quantity) }));
    if (items.length === 0) return;
    setLoading(true);
    try {
      const result = await api.analyzeProductionFeasibility(items);
      setReport((result as FeasibilityReport) || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productionItems]);

  const clearAll = () => { setProductionItems([]); setReport(null); setSavedId(null); };

  const showHistory = async (productId: number, productName: string) => {
    try {
      const data = await api.getProductionHistory(productId);
      setHistoryModal({ visible: true, productId, productName, data: data || null });
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل سجل الإنتاج');
    }
  };

  const saveReport = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const items = productionItems.filter((i) => i.productId && i.quantity).map((i) => ({ productId: i.productId, quantity: Number(i.quantity) }));
      const result = await api.saveFeasibilityReport({ items, report });
      setSavedId(result.id);
      toast.success('تم حفظ التقرير بنجاح');
    } catch {
      toast.error('فشل حفظ التقرير');
    } finally {
      setSaving(false);
    }
  };

  return {
    products, productOptions, productionItems, report, loading, saving, savedId, historyModal,
    setHistoryModal, setProductionItems,
    addItem, removeItem, updateItem, analyze, clearAll, showHistory, saveReport,
  };
}
