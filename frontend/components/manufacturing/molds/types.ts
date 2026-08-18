export type { Product } from '@/types/product';

export interface Mold {
  id: number;
  name: string;
  product_id?: number;
  price: number;
  product_weight: number;
  cavities: number;
  max_shots?: number;
  current_shots?: number;
  status: string;
  notes?: string;
  life_cycle_status?: string;
  product?: { name: string };
}
