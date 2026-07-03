export interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  balance: string | number;
}

export interface TrialBalanceItem {
  account_name: string;
  debit: string | number;
  credit: string | number;
}
