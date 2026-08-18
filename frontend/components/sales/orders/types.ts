import type { Product } from '@/types/product';
export type { Product };

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
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
  order_date?: string;
  created_at: string;
  status: string;
  notes?: string;
  delivered_at?: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface NewOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface Filters {
  search: string;
  fromDate: string;
  toDate: string;
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
}
