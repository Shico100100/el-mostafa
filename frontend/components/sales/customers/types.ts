export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number | string;
}

export interface StatementItem {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
