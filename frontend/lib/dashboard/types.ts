export interface DashboardPanel {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  column: 1 | 2 | 3;
}

export interface DashboardConfig {
  panels: DashboardPanel[];
  date: string;
}

export type PanelId =
  | 'account-balances'
  | 'ar-aging'
  | 'ap-aging'
  | 'revenue-expenses'
  | 'cash-flow'
  | 'shortcuts'
  | 'latest-transactions';

export const DEFAULT_PANELS: DashboardPanel[] = [
  { id: 'account-balances', title: 'أرصدة الحسابات النقدية', visible: true, order: 0, column: 1 },
  { id: 'revenue-expenses', title: 'الإيرادات والمصروفات', visible: true, order: 1, column: 1 },
  { id: 'ar-aging', title: 'تحليل أعمار ديون العملاء', visible: true, order: 2, column: 2 },
  { id: 'ap-aging', title: 'تحليل مستحقات الموردين', visible: true, order: 3, column: 2 },
  { id: 'cash-flow', title: 'التدفق النقدي المتوقع', visible: true, order: 4, column: 2 },
  { id: 'latest-transactions', title: 'آخر العمليات', visible: true, order: 5, column: 3 },
  { id: 'shortcuts', title: 'الوصول السريع', visible: true, order: 6, column: 3 },
];

export interface AccountBalance {
  id: number;
  code: string;
  name: string;
  balance: number;
  type: string;
}

export interface AgingItem {
  id: number;
  name: string;
  total: number;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  over90: number;
}

export interface RevenueExpensesData {
  totalRevenue: number;
  totalExpenses: number;
  costOfSales: number;
  netIncome: number;
  months: { month: string; revenue: number; expenses: number }[];
}

export interface CashFlowData {
  startingCash: number;
  expectedInflows: number;
  expectedOutflows: number;
  netCashFlow: number;
  projectedBalance: number;
  dailyProjection: { date: string; balance: number }[];
}
