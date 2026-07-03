export interface Product {
  id: number;
  name: string;
  selling_price: number;
  stock_quantity: number;
  unit: string;
  type: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
}

export interface QuoteItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Quote {
  id: number;
  customer_id: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  customer?: Customer;
  items?: QuoteItem[];
}
