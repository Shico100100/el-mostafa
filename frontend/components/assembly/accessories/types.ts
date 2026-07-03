export interface AccessoryProduct {
  id: number;
  name: string;
  unit: string;
}

export interface Accessory {
  id: number;
  product: AccessoryProduct;
  preferred_supplier?: { name: string };
  reorder_point: number;
  last_purchase_price: number;
  current_stock: number;
  stock_status: string;
  notes?: string;
  weight_per_piece?: number;
  image_path?: string;
}

export interface HistoryItem {
  id: number;
  date: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes?: string;
}

export interface ReportItem {
  accessory_name?: string;
  product?: { name: string; unit: string };
  unit?: string;
  total_consumed?: number;
  last_movement_date: string;
  current_stock?: number;
}

export interface POItem {
  product_name: string;
  supplier: string;
  current_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  last_price: number;
  total_estimated_cost: number;
}
