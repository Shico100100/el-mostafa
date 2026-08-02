export interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  balance: string | number;
}

export interface TrialBalanceItem {
  code: string;
  name: string;
  type: string;
  balance: number;
  displayBalance: { dr: number; cr: number };
}
