'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Product, Recipe, AssemblyOrder } from '@/components/assembly/production/types';

export function useProduction() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AssemblyOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api.fetchWithAuth('/inventory/products?type=FINISHED')
      .then(data => setProducts(sortAlphabetically(data, 'name')))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getAssemblyOrders();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (!selectedProduct || quantity <= 0) {
      setRecipe(null);
      return;
    }
    const fetchRecipe = async () => {
      setLoadingRecipe(true);
      try {
        const res = await api.fetchWithAuth(`/assembly/recipe/${selectedProduct}?quantity=${quantity}`);
        setRecipe(res);
      } catch {
        setRecipe(null);
      } finally {
        setLoadingRecipe(false);
      }
    };
    const timer = setTimeout(fetchRecipe, 500);
    return () => clearTimeout(timer);
  }, [selectedProduct, quantity]);

  const handleSubmit = async () => {
    if (!selectedProduct || !recipe) return;
    const missing = recipe.items?.some(i => i.status === 'MISSING');
    if (missing) {
      toast.warning('هناك مكونات ناقصة! قد يفشل الخادم');
    }

    setSubmitting(true);
    try {
      await api.fetchWithAuth('/assembly/record', {
        method: 'POST',
        body: JSON.stringify({ productId: selectedProduct, quantity: Number(quantity), date, notes }),
      });
      toast.success('تم تسجيل الإنتاج بنجاح');
      setQuantity(1);
      setNotes('');
      const res = await api.fetchWithAuth(`/assembly/recipe/${selectedProduct}?quantity=1`);
      setRecipe(res);
    } catch {
      toast.error('فشل التسجيل');
    } finally {
      setSubmitting(false);
    }
  };

  const isReady = !!(recipe && recipe.hasBom && !recipe.items?.some(i => i.status === 'MISSING'));

  return {
    products, selectedProduct, setSelectedProduct,
    quantity, setQuantity, date, setDate, notes, setNotes,
    recipe, loadingRecipe, submitting, history, loadingHistory,
    isReady, handleSubmit,
  };
}
