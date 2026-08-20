'use client';

import { MapPin, Package, Edit3, Trash2, Wrench, Puzzle, CheckCircle, Factory } from 'lucide-react';
import type { WH } from '@/hooks/inventory2/useWarehouses';

const typeIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('اكسسوار') || n.includes('accessory')) return <Wrench className="w-7 h-7" />;
  if (n.includes('بلاستيك') || n.includes('plastic')) return <Puzzle className="w-7 h-7" />;
  if (n.includes('تعبئة') || n.includes('تغليف') || n.includes('كرتون') || n.includes('pack')) return <Package className="w-7 h-7" />;
  if (n.includes('تام') || n.includes('finished') || n.includes('منتج')) return <CheckCircle className="w-7 h-7" />;
  return <Factory className="w-7 h-7" />;
};

interface WarehouseCardProps {
  warehouse: WH;
  stockCount: number;
  onOpen: (id: number) => void;
  onEdit: (w: WH) => void;
  onDelete: (id: number, name: string) => void;
}

export function WarehouseCard({ warehouse, stockCount, onOpen, onEdit, onDelete }: WarehouseCardProps) {
  const w = warehouse;
  return (
    <div onClick={() => onOpen(w.id)}
      className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{typeIcon(w.name)}</div>
          <div>
            <h3 className="text-white font-bold">{w.name}</h3>
            {w.description && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{w.description}</p>}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${w.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {w.is_active ? 'نشط' : 'غير نشط'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Package className="w-4 h-4" />
        <span>{stockCount ?? 0} صنف</span>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit(w)} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-blue-300 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5" /> تعديل
        </button>
        <button onClick={() => onDelete(w.id, w.name)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> حذف
        </button>
      </div>
    </div>
  );
}
