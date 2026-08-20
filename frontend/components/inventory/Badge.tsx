import { productTypeLabel } from './types';

const typeConfig: Record<string, { class: string }> = {
  RAW_PLASTIC: { class: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  FINISHED: { class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  PACKAGING: { class: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  IMPORTED: { class: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  RAW: { class: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  SEMI: { class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  SEMI_FINISHED: { class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  DORMANT: { class: 'bg-[#ecfdf5]0/20 text-gray-300 border-[#ecfdf5]0/30' },
};

export function TypeBadge({ type }: { type: string }) {
  const cfg = typeConfig[type] ?? { class: 'bg-[#ecfdf5]0/20 text-gray-300 border-[#ecfdf5]0/30' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.class}`}>
      {productTypeLabel(type)}
    </span>
  );
}

export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity > 10) {
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">متوفر</span>;
  }
  if (quantity > 0) {
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">محدود</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">نفذ</span>;
}
