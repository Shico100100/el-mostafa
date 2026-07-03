export interface QCStats {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface QCInspection {
  id: number;
  production_id: number;
  status: string;
  defects_count: number;
  notes?: string;
  created_at: string;
  inspector?: { id: number; email?: string };
  product?: { id: number; name: string };
  production?: {
    id: number;
    machine?: { name: string };
    mold?: { name: string };
    pieces_produced: number;
  };
}

export interface PendingProduction {
  id: number;
  date: string;
  machine?: { id: number; name: string };
  mold?: { id: number; name: string };
  pieces_produced: number;
  status: string;
}
