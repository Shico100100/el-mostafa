export interface Category {
  id: number;
  name: string;
}

export type { Product } from '@/types/product';

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

export type SortField = 'name' | 'type' | 'cost_price' | 'selling_price' | 'stock_quantity' | 'margin';
export type SortDir = 'asc' | 'desc';
