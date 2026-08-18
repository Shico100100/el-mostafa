'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { toast } from 'sonner';
import type { Account, JournalEntry, JournalLine } from '@/components/accounting/journal/types';

const emptyLines = (): JournalLine[] => [
  { account_id: '', debit: '0', credit: '0' },
  { account_id: '', debit: '0', credit: '0' },
];

export function useJournal() {
  const ready = useAuthCheck();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLine[]>(emptyLines());

  const loadData = useCallback(async () => {
    try {
      const [entriesData, accountsData] = await Promise.all([
        api.fetchWithAuth<JournalEntry[]>('/accounting/journal'),
        api.fetchWithAuth<Account[]>('/accounting/accounts'),
      ]);
      setEntries(entriesData || []);
      setAccounts(sortAlphabetically(accountsData || [], 'name'));
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('فشل تحميل قيود اليومية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReference('');
    setLines(emptyLines());
  };

  const handleAddLine = () => {
    setLines([...lines, { account_id: '', debit: '0', credit: '0' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalLine, value: string) => {
    setLines(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error(`القيد غير متزن! المدين (${totalDebit.toFixed(2)}) لا يساوي الدائن (${totalCredit.toFixed(2)})`);
      return;
    }

    try {
      await api.fetchWithAuth('/accounting/journal', {
        method: 'POST',
        body: JSON.stringify({
          date, description, reference,
          entries: lines.map(line => ({
            account_id: Number(line.account_id),
            debit: Number(line.debit),
            credit: Number(line.credit),
          })),
        }),
      });
      toast.success('تم تسجيل القيد بنجاح');
      setShowModal(false);
      resetForm();
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  return {
    entries, accounts, loading, showModal, setShowModal,
    date, setDate, description, setDescription, reference, setReference,
    lines, totalDebit, totalCredit,
    handleAddLine, handleRemoveLine, handleLineChange, handleSubmit, resetForm,
  };
}
