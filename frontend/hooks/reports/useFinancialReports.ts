'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface BalanceSheetItem {
  code?: string;
  account_name?: string;
  name?: string;
  balance?: number;
  amount?: number;
}

export interface BalanceSheet {
  assets?: BalanceSheetItem[];
  liabilities?: BalanceSheetItem[];
  equity?: BalanceSheetItem[];
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
}

export interface ProfitLossItem {
  code: string;
  name: string;
  balance: number;
}

export interface ProfitLossSection {
  items: ProfitLossItem[];
  total: number;
}

export interface ProfitLoss {
  period?: { start?: string; end?: string };
  revenue?: ProfitLossSection;
  expenses?: ProfitLossSection;
  net_profit?: number;
  is_profit?: boolean;
}

export interface AgedReceivableItem {
  customer_name?: string;
  name?: string;
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90_plus?: number;
  total?: number;
}

export interface AgedPayableItem {
  supplier_name?: string;
  name?: string;
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90_plus?: number;
  total?: number;
}

export interface CashFlowItem {
  account_code: string;
  account_name: string;
  net: number;
}

export interface CashFlowSection {
  items?: CashFlowItem[];
  total?: number;
}

export interface CashFlowStatement {
  period?: { start?: string; end?: string };
  operating_activities?: CashFlowSection;
  investing_activities?: CashFlowSection;
  financing_activities?: CashFlowSection;
  net_cash_flow: number;
}

export function useFinancialReports() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [agedReceivables, setAgedReceivables] = useState<AgedReceivableItem[]>([]);
  const [agedPayables, setAgedPayables] = useState<AgedPayableItem[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [bs, pl, ar, ap, cf] = await Promise.all([
        api.fetchWithAuth<BalanceSheet>('/reports/balance-sheet'),
        api.fetchWithAuth<ProfitLoss>('/reports/profit-loss-journal').catch(() => null),
        api.fetchWithAuth<AgedReceivableItem[]>('/reports/aged-receivables').catch(() => []),
        api.fetchWithAuth<AgedPayableItem[]>('/reports/aged-payables').catch(() => []),
        api.fetchWithAuth<CashFlowStatement>('/reports/cash-flow-statement').catch(() => null),
      ]);
      setBalanceSheet(bs);
      setProfitLoss(pl);
      setAgedReceivables(ar || []);
      setAgedPayables(ap || []);
      setCashFlow(cf);
    } catch { toast.error('فشل تحميل التقارير'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  return { loading, balanceSheet, profitLoss, agedReceivables, agedPayables, cashFlow };
}
