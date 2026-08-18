'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthCheck } from '@/lib/useAuthCheck';

export interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  balance: number;
}

export interface BankTransaction {
  id: number;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  reference?: string;
}

export interface BankStatement {
  account: BankAccount;
  transactions: BankTransaction[];
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
}

export function useBanking() {
  const router = useRouter();
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', bank_name: '', account_number: '' });

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<BankAccount[]>('/accounting/banking/accounts');
      setAccounts(data || []);
    } catch { toast.error('فشل تحميل الحسابات البنكية'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadAccounts();
  }, [ready, loadAccounts]);

  const selectAccount = async (id: number) => {
    try {
      const [txData, stmtData] = await Promise.all([
        api.fetchWithAuth<BankTransaction[]>(`/accounting/banking/accounts/${id}/transactions`),
        api.fetchWithAuth<BankStatement>(`/accounting/banking/accounts/${id}/statement`),
      ]);
      setSelectedAccount(accounts.find((a) => a.id === id) ?? null);
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
