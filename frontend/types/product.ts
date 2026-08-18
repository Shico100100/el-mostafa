export interface Product {
  id: number;
  name: string;
  type: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock?: number;
  warehouse_id?: number;
  warehouse?: { id: number; name: string; location?: string };
  category_id?: number;
  category?: { id: number; name: string };
  sku?: string;
  barcode?: string;
  description?: string;
  image_path?: string;
  weight_grams?: number;
  raw_material_type?: string;
  pieces_per_carton?: number;
  created_at?: string;
  updated_at?: string;
}
