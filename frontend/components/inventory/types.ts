export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  type: 'RAW' | 'SEMI' | 'FINISHED' | 'IMPORTED' | 'RAW_PLASTIC' | 'PACKAGING' | 'CARTON' | 'BOX';
  category_id?: number;
  category?: Category;
  warehouse_id?: number;
  warehouse?: Warehouse;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  unit: string;
  min_stock?: number;
  description?: string;
  image_path?: string;
  weight_grams?: number;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

export type SortField = 'name' | 'type' | 'cost_price' | 'selling_price' | 'stock_quantity' | 'margin';
export type SortDir = 'asc' | 'desc';
