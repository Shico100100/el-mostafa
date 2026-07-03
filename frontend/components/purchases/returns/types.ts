export interface Supplier {
  id: number;
  name: string;
}

export interface PurchaseOrder {
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

export interface PurchaseReturn {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  order_id?: number;
  return_date: string;
  total_amount: number;
  reason?: string;
  items: ReturnItem[];
}
