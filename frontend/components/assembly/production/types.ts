export interface Product {
  id: number;
  name: string;
  unit: string;
  type: string;
}

export interface RecipeItem {
  productId: number;
  name: string;
  unit: string;
  required: number;
  available: number;
  status: 'OK' | 'MISSING';
}

export interface Recipe {
  product: string;
  quantity: number;
  hasBom: boolean;
  items: RecipeItem[];
}

export interface AssemblyOrder {
  id: number;
  date: string;
  quantity_produced: number;
  total_cost: number;
  status: string;
  bom: { id: number; name: string; product?: { name: string; unit: string } };
  worker?: { id: number; firstName: string; lastName: string };
  created_at: string;
}
