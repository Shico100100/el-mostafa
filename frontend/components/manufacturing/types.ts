export interface Machine {
  id: number;
  name: string;
  status: string;
  last_mold_id?: number;
  last_product_id?: number;
}

export interface Mold {
  id: number;
  name: string;
  product_weight?: number;
}

export interface RawMaterial {
  id: number;
  product?: { name: string };
}

export interface ProductionRecord {
  id: number;
  date: string;
  machine_id: number;
  machine?: Machine;
  mold_id: number;
  mold?: Mold;
  product_id: number;
  raw_material?: RawMaterial;
  total_production_kg: number;
  hours_worked: number;
  pieces_produced: number;
  notes?: string;
}

export interface RangeSession {
  id: number;
  machine_id?: number;
  machine?: { name: string };
  mold_id?: number;
  mold?: { name: string };
  product_id?: number;
  raw_material?: { product?: { name: string } };
  start_date?: string;
  end_date?: string;
  total_production_kg?: string | number;
  hours_worked?: string | number;
  mode?: string;
  notes?: string;
  created_at?: string;
}

export interface SessionDetail {
  session: RangeSession;
  records?: ProductionRecord[];
}

export interface RecordHistoryEntry {
  id: number;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_at: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

export interface BulkProductionItem {
  machine_id: number;
  machine_name: string;
  mold_id: string | number;
  product_id: string | number;
  total_production_kg: string | number;
  hours_worked: string | number;
  notes: string;
}

export interface NormalizedProductionItem {
  mold_id?: number;
  product_id?: number;
  total_production_kg?: number;
  hours_worked?: number;
  notes: string;
  machine_id?: number;
  machine_name?: string;
}

export const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-slate-500',
  MAINTENANCE: 'bg-yellow-500',
  BROKEN: 'bg-red-500',
};

export const statusLabels: Record<string, string> = {
  ACTIVE: 'نشطة',
  INACTIVE: 'متوقفة',
  MAINTENANCE: 'صيانة',
  BROKEN: 'عاطلة',
};
