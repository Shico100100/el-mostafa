export interface Customer {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  order_date: string;
}

export interface ReturnItem {
  product_id: number;
  name: string;
  original_qty: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SalesReturn {
  id: number;
  customer_id: number;
  customer?: Customer;
  order_id?: number;
  return_date: string;
  total_amount: number;
  reason?: string;
  items: ReturnItem[];
}

export interface NewReturnForm {
  customer_id: string;
  order_id: string;
  reason: string;
  return_date: string;
  items: ReturnItem[];
}
