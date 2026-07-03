export interface Account {
  id: number;
  code: string;
  name: string;
}

export interface JournalEntry {
  id: number;
  date: string;
  description: string;
  account?: Account;
  debit: string | number;
  credit: string | number;
}

export interface JournalLine {
  account_id: string;
  debit: string;
  credit: string;
}
