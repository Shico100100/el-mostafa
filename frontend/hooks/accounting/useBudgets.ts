'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useBudgets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [lines, setLines] = useState<{ account_id: number; budgeted_amount: number }[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [variance, setVariance] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [budgetsData, accountsData] = await Promise.all([
        api.fetchWithAuth<any[]>('/accounting/budgets'),
        api.fetchWithAuth<any[]>('/accounting/accounts'),
      ]);
      setBudgets(budgetsData || []);
      setAccounts(accountsData || []);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, []);

  const loadVariance = useCallback(async (budgetId: number) => {
    try {
      const data = await api.fetchWithAuth<any>(`/accounting/budgets/${budgetId}/variance`);
      setVariance(data);
      setSelectedBudget(budgetId);
    } catch { toast.error('فشل تحميل تقرير الانحرافات'); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fetchWithAuth('/accounting/budgets', {
        method: 'POST',
        body: JSON.stringify({ name, period, lines }),
      });
      toast.success('تم إنشاء الميزانية');
      setShowModal(false); setName(''); setLines([]);
      loadData();
    } catch { toast.error('حدث خطأ'); }
  };

  const addLine = () => setLines([...lines, { account_id: accounts[0]?.id || 0, budgeted_amount: 0 }]);
  const updateLine = (i: number, field: string, value: any) => { const l = [...lines]; (l[i] as any)[field] = value; setLines(l); };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return { loading, budgets, accounts, showModal, setShowModal, name, setName, period, setPeriod, lines, addLine, updateLine, removeLine, handleSubmit, selectedBudget, setSelectedBudget, variance, setVariance, loadVariance };
}
