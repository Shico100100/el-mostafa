export type { Product } from '@/types/product';

export interface WarehouseItem {
  id: number;
  name: string;
}

export interface StockItem {
  product_id: number;
  warehouse_id: number;
  quantity: string;
}
