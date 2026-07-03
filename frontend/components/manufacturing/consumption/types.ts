export interface Consumption {
  id: number;
  raw_material: {
    id: number;
    product: { name: string; unit: string };
  };
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  consumed_at: string;
  assembly_order?: { id: number };
  production?: { id: number };
  notes?: string;
}

export interface ConsumptionStats {
  totalConsumptions: number;
  totalCost: number;
  totalQuantity: number;
}
