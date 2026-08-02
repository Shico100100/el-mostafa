'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useBanking() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statement, setStatement] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', bank_name: '', account_number: '' });

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<any[]>('/accounting/banking/accounts');
      setAccounts(data || []);
    } catch { toast.error('فشل تحميل الحسابات البنكية'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadAccounts();
  }, [router, loadAccounts]);

  const selectAccount = async (id: number) => {
    try {
      const [txData, stmtData] = await Promise.all([
        api.fetchWithAuth<any[]>(`/accounting/banking/accounts/${id}/transactions`),
        api.fetchWithAuth<any>(`/accounting/banking/accounts/${id}/statement`),
      ]);
      setSelectedAccount(accounts.find((a: any) => a.id === id));
      setTransactions(txData || []);
      setStatement(stmtData);
    } catch { toast.error('فشل تحميل البيانات'); }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/accounting/banking/accounts', { method: 'POST', body: JSON.stringify(newAcc) });
      toast.success('تم إنشاء الحساب البنكي');
      setShowAddModal(false); setNewAcc({ name: '', bank_name: '', account_number: '' });
      loadAccounts();
    } catch { toast.error('حدث خطأ'); }
  };

  return { loading, accounts, selectedAccount, transactions, statement, showAddModal, setShowAddModal, newAcc, setNewAcc, selectAccount, createAccount };
}
