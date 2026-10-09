import type { Product } from '@/types/product';
export type { Product };

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance?: number;
  credit_limit?: number | null;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Order {
  id: number;
  customer_id: number;
  total_amount: number;
  discount_type?: string;
  discount_value?: number;
  paid_amount?: number;
  remaining?: number;
  invoice_number?: string;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  delivered_by_name?: string | null;
  cancelled_by_name?: string | null;
  order_date?: string;
  created_at: string;
  status: string;
  notes?: string;
  delivered_at?: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface Warehouse {
  id: number;
  name: string;
}

export interface OrderPayment {
  id: number;
  amount: number;
  payment_date: string;
  method?: string | null;
  notes?: string;
}

export interface NewOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  warehouse_id?: string;
}

export interface Filters {
  search: string;
  fromDate: string;
  toDate: string;
  status: string;
  delivered: string;
  payment: string;
  page: number;
  limit: number;
}

export interface NewOrderData {
  customer_id: string;
  date: string;
  notes: string;
  items: NewOrderItem[];
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
}

export interface PaymentData {
  amount: number;
  payment_date: string;
  notes: string;
  method: string;
}
