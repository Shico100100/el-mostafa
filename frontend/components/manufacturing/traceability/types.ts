export interface Batch {
  id: number;
  batch_number: string;
  product: { id: number; name: string; unit: string };
  production_date: string;
  expiry_date?: string;
  quantity: number;
  unit: string;
  status: string;
  notes?: string;
  created_at: string;
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'معلق', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  RELEASED: { label: 'منشور', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ON_HOLD: { label: 'معلق مؤقتاً', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  RECALLED: { label: 'مسحوب', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  EXPIRED: { label: 'منتهي الصلاحية', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};
