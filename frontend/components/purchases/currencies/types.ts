export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_egp: number;
  is_active: boolean;
}

export interface FxRate {
  id: number;
  currency_id: number;
  rate_to_egp: number;
  amount_paid: number;
  notes: string;
  rate_date: string;
  currency?: Currency;
}
