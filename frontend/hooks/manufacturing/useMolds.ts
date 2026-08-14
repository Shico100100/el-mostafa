'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Mold, Product } from '@/components/manufacturing/molds/types';

export function useMolds() {
  const [molds, setMolds] = useState<Mold[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingMold, setEditingMold] = useState<Mold | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedMoldForIssue, setSelectedMoldForIssue] = useState<Mold | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [moldsData, productsData] = await Promise.all([
        api.fetchWithAuth('/manufacturing/molds'),
        api.fetchWithAuth('/inventory/products'),
      ]);
      const moldsList = moldsData as Mold[] | { items?: Mold[] };
      const productsList = productsData as Product[] | { data?: Product[] };
      setMolds(sortAlphabetically(Array.isArray(moldsList) ? moldsList : (moldsList.items ?? []), 'name'));
      setProducts(sortAlphabetically(Array.isArray(productsList) ? productsList : (productsList.data ?? []), 'name'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredMolds = molds.filter(mold => {
    const matchesSearch = mold.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || mold.status === statusFilter;
    const matchesProduct = productFilter === 'ALL' || mold.product_id?.toString() === productFilter;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editingMold) {
        await api.fetchWithAuth(`/manufacturing/molds/${editingMold.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث الإسطمبة');
      } else {
        await api.fetchWithAuth('/manufacturing/molds', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة الإسطمبة');
      }
      setShowModal(false);
      setEditingMold(null);
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء حفظ الإسطمبة');
    }
  };

  const handleSaveIssue = async (description: string, file: File | null) => {
    if (!selectedMoldForIssue) return;
    let imageUrl = '';
    if (file) {
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const data: { url: string } = await api.fetchWithAuth('/v1/manufacturing/upload', {
          method: 'POST',
          body: uploadData,
        });
        imageUrl = data.url;
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    const payload = {
      mold_id: selectedMoldForIssue.id,
      date: new Date().toISOString().split('T')[0],
      description,
      status: 'OPEN',
      image_path: imageUrl,
    };
    try {
      await api.fetchWithAuth('/manufacturing/mold-issues', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShowIssueModal(false);
      setSelectedMoldForIssue(null);
      toast.success('تم تسجيل المشكلة بنجاح');
    } catch {
      toast.error('فشل تسجيل المشكلة');
    }
  };

  return {
    molds, products, loading,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter, productFilter, setProductFilter,
    showModal, setShowModal, editingMold, setEditingMold,
    showIssueModal, setShowIssueModal, selectedMoldForIssue, setSelectedMoldForIssue,
    filteredMolds, handleSave, handleSaveIssue, loadData,
  };
}
