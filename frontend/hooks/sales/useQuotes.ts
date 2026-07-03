'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Quote, Customer, Product } from '@/components/sales/quotes/types';

export interface NewQuoteItem {
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

export function useQuotes() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [newQuote, setNewQuote] = useState({ customer_id: '', notes: '', items: [] as NewQuoteItem[] });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quotesData, customersData, productsData] = await Promise.all([
        api.fetchWithAuth('/sales/quotes'),
        api.fetchWithAuth('/sales/customers'),
        api.fetchWithAuth('/inventory/products'),
      ]);
      setQuotes(quotesData || []);
      setCustomers(customersData || []);
      setProducts((productsData || []).filter((p: Product) => p.type === 'FINISHED' || p.type === 'SEMI'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const filteredQuotes = quotes.filter((q) =>
    !search || q.customer?.name?.includes(search) || q.notes?.includes(search) || String(q.id).includes(search)
  );

  const handleAddItem = () => {
    setNewQuote({ ...newQuote, items: [...newQuote.items, { product_id: '', quantity: 1, price: 0, total: 0 }] });
  };

  const handleRemoveItem = (index: number) => {
    setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== index) });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const items = [...newQuote.items];
    items[index] = { ...items[index], [field]: value } as NewQuoteItem;
    if (field === 'product_id') {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        items[index].price = product.selling_price;
        items[index].total = items[index].quantity * product.selling_price;
      }
    }
    if (field === 'quantity' || field === 'price') {
      items[index].total = Number(items[index].quantity) * Number(items[index].price);
    }
    setNewQuote({ ...newQuote, items });
  };

  const calculateTotal = () => newQuote.items.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/sales/quotes', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: parseInt(newQuote.customer_id),
          total_amount: calculateTotal(),
          notes: newQuote.notes,
          items: newQuote.items.map((item) => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        }),
      });
      setShowCreateModal(false);
      setNewQuote({ customer_id: '', notes: '', items: [] });
      await loadData();
      toast.success('تم إنشاء عرض السعر بنجاح');
    } catch {
      toast.error('فشل إنشاء عرض السعر');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.fetchWithAuth(`/sales/quotes/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleConvertToOrder = async (id: number) => {
    try {
      await api.fetchWithAuth(`/sales/quotes/${id}/convert`, { method: 'POST' });
      await loadData();
      toast.success('تم تحويل عرض السعر إلى أمر بيع بنجاح');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'فشل تحويل عرض السعر');
    }
  };

  const handleDeleteQuote = async (id: number) => {
    try {
      await api.fetchWithAuth(`/sales/quotes/${id}`, { method: 'DELETE' });
      await loadData();
      toast.success('تم حذف عرض السعر');
    } catch {
      toast.error('فشل حذف عرض السعر');
    }
  };

  return {
    quotes, customers, products, loading, search, setSearch,
    showCreateModal, setShowCreateModal,
    showDetailsModal, setShowDetailsModal,
    selectedQuote, setSelectedQuote,
    newQuote, setNewQuote,
    filteredQuotes, loadData,
    handleAddItem, handleRemoveItem, handleItemChange, calculateTotal,
    handleCreateQuote, handleUpdateStatus, handleConvertToOrder, handleDeleteQuote,
  };
}
