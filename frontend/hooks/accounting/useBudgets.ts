'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface BudgetLine {
  id: number;
  account?: { code: string; name: string };
  budgeted_amount: number;
}

export interface Budget {
  id: number;
  name: string;
  period: string;
  status: string;
  lines: BudgetLine[];
}

export interface BudgetLineInput {
  account_id: number;
  budgeted_amount: number;
}

export interface AccountOption {
  id: number;
  code: string;
  name: string;
}

export interface BudgetVarianceLine {
  account_code: string;
  account_name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface BudgetVariance {
  budget_id: number;
  name: string;
  period: string;
  lines: BudgetVarianceLine[];
  totalBudgeted: number;
  totalActual: number;
}

export function useBudgets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [lines, setLines] = useState<BudgetLineInput[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [variance, setVariance] = useState<BudgetVariance | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [budgetsData, accountsData] = await Promise.all([
        api.fetchWithAuth<Budget[]>('/accounting/budgets'),
        api.fetchWithAuth<AccountOption[]>('/accounting/accounts'),
      ]);
      setBudgets(budgetsData || []);
      setAccounts(accountsData || []);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, []);

  const loadVariance = useCallback(async (budgetId: number) => {
    try {
      const data = await api.fetchWithAuth<BudgetVariance>(`/accounting/budgets/${budgetId}/variance`);
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
  const updateLine = (i: number, field: keyof BudgetLineInput, value: number) => { const l = [...lines]; l[i][field] = value; setLines(l); };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return { loading, budgets, accounts, showModal, setShowModal, name, setName, period, setPeriod, lines, addLine, updateLine, removeLine, handleSubmit, selectedBudget, setSelectedBudget, variance, setVariance, loadVariance };
}
