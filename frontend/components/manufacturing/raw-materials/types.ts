export interface RawMaterial {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    unit: string;
    cost_price: number;
  };
  preferred_supplier?: {
    id: number;
    name: string;
  };
  reorder_point: number;
  reorder_quantity: number;
  last_purchase_price?: number;
  current_stock: number;
  stock_status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  notes?: string;
}
