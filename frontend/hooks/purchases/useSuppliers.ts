'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Supplier, StatementItem } from '@/components/purchases/suppliers/types';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statement, setStatement] = useState<StatementItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<Supplier[]>('/purchases/suppliers');
      const mapped = data.map((s) => ({ ...s, balance: Number(s.balance) }));
      setSuppliers(mapped);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatement = async (id: number) => {
    setStatementLoading(true);
    try {
      const data = await api.getSupplierStatement(id);
      setStatement(data || []);
    } catch {
      console.error('Error loading statement:');
    } finally {
      setStatementLoading(false);
    }
  };

  const openStatement = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setStatement([]);
    setShowStatementModal(true);
    loadStatement(supplier.id);
  };

  const handleSave = async (data: { name: string; phone?: string; email?: string; address?: string }) => {
    try {
      if (editingSupplier) {
        await api.fetchWithAuth(`/purchases/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث المورد');
      } else {
        await api.fetchWithAuth('/purchases/suppliers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة المورد');
      }
      setShowModal(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch {
      toast.error('فشل حفظ المورد');
    }
  };

  const handlePayment = async (data: { amount: number; payment_date: string | null; notes: string }) => {
    if (!selectedSupplier) return;
    try {
      await api.addSupplierPayment(selectedSupplier.id, data);
      setShowPaymentModal(false);
      toast.success('تم تسجيل الدفعة');
      loadSuppliers();
    } catch {
      toast.error('فشل تسجيل الدفعة');
    }
  };

  return {
    suppliers, loading, showModal, setShowModal, editingSupplier, setEditingSupplier,
    showStatementModal, setShowStatementModal, showPaymentModal, setShowPaymentModal,
    statement, selectedSupplier, setSelectedSupplier, statementLoading,
    loadSuppliers, openStatement, handleSave, handlePayment,
  };
}
