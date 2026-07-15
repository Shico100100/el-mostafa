'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Customer, StatementItem, FilterState, FilterStatus, SortField, SortOrder, OVERDUE_THRESHOLD } from '@/components/sales/customers/types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statement, setStatement] = useState<StatementItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementMonth, setStatementMonth] = useState<number | undefined>();
  const [statementYear, setStatementYear] = useState<number | undefined>();
  
  // Quick View state
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewCustomer, setQuickViewCustomer] = useState<Customer | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    filterStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchWithAuth('/sales/customers');
      setCustomers(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  const loadStatement = async (customerId: string, month?: number, year?: number) => {
    try {
      setStatementLoading(true);
      let url = `/sales/customers/${customerId}/statement`;
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await api.fetchWithAuth(url);
      setStatement(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل كشف الحساب');
    } finally {
      setStatementLoading(false);
    }
  };

  const handleSave = async (data: Partial<Customer>) => {
    try {
      if (editingCustomer) {
        await api.fetchWithAuth(`/sales/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await api.fetchWithAuth('/sales/customers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة العميل بنجاح');
      }
      await loadCustomers();
      setShowModal(false);
      setEditingCustomer(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ العميل');
    }
  };

  const handlePayment = async (data: { amount: number; payment_date: string | null; notes?: string }) => {
    if (!selectedCustomer) return;
    try {
      await api.addCustomerPayment(Number(selectedCustomer.id), data);
      toast.success('تم تسجيل السند بنجاح');
      await loadCustomers();
      setShowPaymentModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل السند');
    }
  };

  const handleStatementFilter = (month?: number, year?: number) => {
    setStatementMonth(month);
    setStatementYear(year);
    if (selectedCustomer) {
      loadStatement(selectedCustomer.id, month, year);
    }
  };

  const clearStatementFilter = () => {
    setStatementMonth(undefined);
    setStatementYear(undefined);
    if (selectedCustomer) {
      loadStatement(selectedCustomer.id);
    }
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.filterStatus !== 'all') {
      result = result.filter((c) => {
        switch (filters.filterStatus) {
          case 'clean':
            return c.balance <= 0;
          case 'debt':
            return c.balance > 0;
          case 'overdue':
            return c.balance > OVERDUE_THRESHOLD;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [customers, filters]);

  // Stats
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    debtorsCount: customers.filter((c) => c.balance > 0).length,
    totalDebt: customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0),
    cleanCount: customers.filter((c) => c.balance <= 0).length,
  }), [customers]);

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const handleFilterStatus = (status: FilterStatus) => {
    setFilters((prev) => ({ ...prev, filterStatus: status }));
  };

  const handleSort = (field: SortField, order: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  // Quick View handlers
  const openQuickView = (customer: Customer) => {
    setQuickViewCustomer(customer);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setQuickViewCustomer(null);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    filteredCustomers,
    loading,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    showStatementModal,
    setShowStatementModal,
    showPaymentModal,
    setShowPaymentModal,
    statement,
    selectedCustomer,
    setSelectedCustomer,
    statementLoading,
    statementMonth,
    statementYear,
    showQuickView,
    quickViewCustomer,
    filters,
    stats,
    loadCustomers,
    loadStatement,
    handleSave,
    handlePayment,
    handleStatementFilter,
    clearStatementFilter,
    handleSearch,
    handleFilterStatus,
    handleSort,
    openQuickView,
    closeQuickView,
  };
}
