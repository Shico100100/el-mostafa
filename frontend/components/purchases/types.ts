export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

import type { Product } from '@/types/product';
export type { Product };

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
  weight_kg?: number;
}

export interface Order {
  id: number;
  supplier_id: number;
  total_amount: number;
  order_date?: string;
  created_at: string;
  invoice_number?: string;
  notes?: string;
  supplier?: Supplier;
  items?: OrderItem[];
}

export interface NewOrderItem {
  product_id: string;
  quantity: number;
  price: number;
  weight_kg?: string;
}

export interface LandedCostBreakdownItem {
  item_id?: number;
  product_name: string;
  quantity: number;
  base_cost_egp: number;
  commission: number;
  customs: number;
  shipping: number;
  unit_landed_cost: number;
  total_landed_cost: number;
}

export interface LandedCostData {
  total_landed_cost: number;
  fx_rate: number;
  freight_cost?: number;
  total_weight_kg: number;
  breakdown: LandedCostBreakdownItem[];
}

export interface PackingListForm {
  carton_length_cm: string;
  carton_width_cm: string;
  carton_height_cm: string;
  cartons_count: string;
  actual_net_weight_kg: string;
  actual_gross_weight_kg: string;
  deviation_threshold_percent: string;
  notes: string;
}
