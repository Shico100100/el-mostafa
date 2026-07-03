export interface Machine {
  id: number;
  name: string;
  last_maintenance: string | null;
  next_maintenance: string | null;
  status: string;
  maintenance_interval_days: number;
}

export interface MaintenanceLog {
  id: number;
  date: string;
  machine: { name: string };
  type: string;
  description: string;
  cost: number;
  status: string;
}
