'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Account, TrialBalanceItem } from '@/components/accounting/types';

export function useAccounting() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('ASSET');
  const [description, setDescription] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [accountsData, trialData] = await Promise.all([
        api.fetchWithAuth<Account[]>('/accounting/accounts'),
        api.fetchWithAuth<TrialBalanceItem[]>('/accounting/trial-balance'),
      ]);
      setAccounts(sortAlphabetically(accountsData || [], 'name'));
      setTrialBalance(trialData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('فشل تحميل بيانات الحسابات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const resetForm = () => { setCode(''); setName(''); setDescription(''); setType('ASSET'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/accounting/accounts', {
        method: 'POST',
        body: JSON.stringify({ code, name, type, description }),
      });
      toast.success('تم إضافة الحساب بنجاح');
      setShowModal(false);
      resetForm();
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const accountTypeCounts = [
    { name: 'أصول', value: accounts.filter(a => a.type === 'ASSET').length },
    { name: 'خصوم', value: accounts.filter(a => a.type === 'LIABILITY').length },
    { name: 'حقوق ملكية', value: accounts.filter(a => a.type === 'EQUITY').length },
    { name: 'إيرادات', value: accounts.filter(a => a.type === 'REVENUE').length },
    { name: 'مصروفات', value: accounts.filter(a => a.type === 'EXPENSE').length },
  ];

  const topTrialBalance = trialBalance
    .filter(item => Math.abs(item.displayBalance?.dr || 0) > 0 || Math.abs(item.displayBalance?.cr || 0) > 0)
    .sort((a, b) => (Math.abs(b.balance)) - Math.abs(a.balance))
    .slice(0, 5)
    .map(item => ({
      name: item.name,
      debit: item.displayBalance?.dr || 0,
      credit: item.displayBalance?.cr || 0,
    }));

  const totalsByType = (['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map(t => ({
    type: t,
    total: accounts.filter(a => a.type === t).reduce((sum, a) => sum + Number(a.balance), 0),
  }));

  return {
    loading, accounts, trialBalance, showModal, setShowModal,
    code, setCode, name, setName, type, setType, description, setDescription,
    handleSubmit, accountTypeCounts, topTrialBalance, totalsByType,
  };
}
