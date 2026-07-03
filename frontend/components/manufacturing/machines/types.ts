export interface Machine {
  id: number;
  name: string;
  serial_number: string;
  status: string;
  total_hours: number;
  power_consumption: number;
  price: number;
  useful_life_years: number;
  notes: string;
  purchase_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface OverviewResponse {
  machines: Machine[];
  pagination: { total: number; page: number; limit: number };
}
