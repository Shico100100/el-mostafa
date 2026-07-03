export interface Product {
  id: number;
  name: string;
  type: string;
  stock_quantity: string;
}

export interface WarehouseItem {
  id: number;
  name: string;
}

export interface StockItem {
  product_id: number;
  warehouse_id: number;
  quantity: string;
}
