export interface Product {
  id: number;
  name: string;
  sku: string;
  unit: string;
  type: string;
  cost_price: number;
  weight_grams: number;
  image_path: string;
  raw_material_type: string;
  description: string;
  pieces_per_carton?: number;
}

export interface BOMItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface BOM {
  id: number;
  name: string;
  product_id: number;
  product: Product;
  items: BOMItem[];
  pcs_per_carton: number;
  pcs_per_box: number;
  carton_product_id: number | null;
  carton_product: Product | null;
  box_product_id: number | null;
  box_product: Product | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ExplodedComponent {
  product_id: number;
  product_name: string;
  sku: string;
  specs: string;
  weight_grams: number;
  raw_material_type: string;
  image_path: string;
  quantity_per_unit: number;
  total_quantity: number;
  unit: string;
  total_weight_grams: number;
  total_weight_kg: number;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
}

export interface ExplosionResult {
  bom_id: number;
  bom_name: string;
  product_name: string;
  product_cost_price: number;
  product_selling_price: number;
  requested_quantity: number;
  total_components: number;
  total_weight_grams: number;
  total_weight_kg: number;
  components: ExplodedComponent[];
  pcs_per_carton: number;
  pcs_per_box: number;
  carton_product: Product | null;
  box_product: Product | null;
}

export interface CostResult {
  total_cost: number;
  material_cost: number;
  overhead_cost: number;
  overhead_per_piece: number;
  cost_per_unit: number;
}

export interface BOMFormItem {
  product_id: string;
  quantity: string;
}

export interface ExplosionTableRow {
  name: string;
  type: string;
  qty: number;
  unit: string;
  weight_kg: number;
  image: string;
  stock: number | undefined;
  cost_price: number | undefined;
}
