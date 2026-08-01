// RAW_PLASTIC exists in DB but treated as RAW in the UI (خام)
// SEMI_FINISHED is the DB value; SEMI is also accepted for display grouping
export type ProductType = 'FINISHED' | 'IMPORTED' | 'RAW' | 'PACKAGING' | 'RAW_PLASTIC' | 'SEMI' | 'SEMI_FINISHED' | 'DORMANT';

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  unit: string;
  cost_price: string;
  selling_price: string;
  stock_quantity: string;
  min_stock?: string;
  warehouse_id: number;
  created_at: string;
  updated_at: string;
}

export interface SemiFinishedProduct {
  id: number;
  name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  type: string;
}

export interface BOMItem {
  id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

export interface BOM {
  id: number;
  name: string;
  product_id: number;
  product?: Product;
  items: BOMItem[];
  pcs_per_carton: number;
  pcs_per_box: number;
  carton_product_id: number;
  box_product_id: number;
  carton_product?: Product;
  box_product?: Product;
  description?: string;
}

export interface CompactProduct {
  id: number;
  name: string;
  type?: string;
  unit?: string;
  cost_price?: string;
  selling_price?: string;
}

export interface StockItem {
  product_id: number;
  warehouse_id: number;
  quantity: string;
  product?: { id: number; name: string; type?: string; unit?: string };
  warehouse?: { id: number; name: string };
}

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: string;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  date?: string;
  created_at: string;
  product?: { id: number; name: string };
  warehouse?: { id: number; name: string };
}

// UI-facing label map – RAW_PLASTIC is mapped to 'خام'
const displayLabels: Record<string, string> = {
  FINISHED: 'منتج تام',
  IMPORTED: 'مستورد',
  RAW: 'خام',
  RAW_PLASTIC: 'خام',
  PACKAGING: 'تغليف',
  SEMI: 'نصف مصنع',
  SEMI_FINISHED: 'نصف مصنع',
  DORMANT: 'خامل',
};

export function productTypeLabel(type: string): string {
  return displayLabels[type] ?? type;
}

export function normalizeType(type: string): ProductType {
  if (type === 'RAW_PLASTIC') return 'RAW';
  if (type === 'SEMI_FINISHED') return 'SEMI';
  return type as ProductType;
}

export function shouldShowPrice(type: string): 'selling' | 'cost' | 'none' {
  if (type === 'FINISHED') return 'selling';
  if (type === 'IMPORTED' || type === 'PACKAGING' || type === 'RAW_PLASTIC') return 'none';
  return 'cost';
}
