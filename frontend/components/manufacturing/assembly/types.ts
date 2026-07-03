export interface BOM {
  id: number;
  name: string;
  product?: { name: string };
}

export interface AssemblyOrder {
  id: number;
  date: string;
  quantity_produced: number;
  total_cost: number;
  bom?: { product?: { name: string } };
}
