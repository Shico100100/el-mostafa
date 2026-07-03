'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer, StatementItem } from '@/components/sales/customers/types';

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

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth('/sales/customers');
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatement = async (id: number) => {
    setStatementLoading(true);
    try {
      const data = await api.getCustomerStatement(id);
      setStatement(data || []);
    } catch {
      console.error('Error loading statement:');
    } finally {
      setStatementLoading(false);
    }
  };

  const openStatement = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStatement([]);
    setShowStatementModal(true);
    loadStatement(customer.id);
  };

  const handleSave = async (data: { name: string; phone?: string; email?: string; address?: string }) => {
    try {
      if (editingCustomer) {
        await api.fetchWithAuth(`/sales/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث العميل');
      } else {
        await api.fetchWithAuth('/sales/customers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة العميل');
      }
      setShowModal(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch {
      toast.error('فشل حفظ العميل');
    }
  };

  const handlePayment = async (data: { amount: number; payment_date: string | null; notes: string }) => {
    if (!selectedCustomer) return;
    try {
      await api.addCustomerPayment(selectedCustomer.id, data);
      setShowPaymentModal(false);
      toast.success('تم تسجيل التحصيل');
      loadCustomers();
    } catch {
      toast.error('فشل تسجيل التحصيل');
    }
  };

  return {
    customers, loading, showModal, setShowModal, editingCustomer, setEditingCustomer,
    showStatementModal, setShowStatementModal, showPaymentModal, setShowPaymentModal,
    statement, selectedCustomer, setSelectedCustomer, statementLoading,
    loadCustomers, openStatement, handleSave, handlePayment,
  };
}
