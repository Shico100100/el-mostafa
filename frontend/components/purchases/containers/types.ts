export interface Container {
  id: number;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  max_weight_kg: number;
  max_cbm: number;
  is_active: boolean;
  notes: string;
}

export interface ContainerSuggestion {
  id: number;
  name: string;
  max_cbm: number;
  utilization_pct: number;
  remaining_cbm: number;
  fits: boolean;
}

export interface CbmResult {
  total_cbm: number;
  cartons_count: number;
  carton_volume_cm3: number;
  carton_dimensions: { length_cm: number; width_cm: number; height_cm: number };
  container_suggestions: ContainerSuggestion[];
}
