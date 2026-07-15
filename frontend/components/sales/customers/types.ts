export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  createdAt?: string;
}

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export const OVERDUE_THRESHOLD = 10000;

export type FilterStatus = 'all' | 'clean' | 'debt' | 'overdue';
export type SortField = 'name' | 'balance' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  filterStatus: FilterStatus;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface CustomerStats {
  totalCustomers: number;
  debtorsCount: number;
  totalDebt: number;
  cleanCount: number;
}
