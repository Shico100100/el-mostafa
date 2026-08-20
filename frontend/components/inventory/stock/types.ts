export interface StockItem {
  product?: { id: number; name: string; sku?: string; type?: string; unit?: string };
  warehouse?: { id: number; name: string };
  product_id: number;
  warehouse_id: number;
  quantity: string;
}

export interface WarehouseOption {
  id: number; name: string;
}
