'use client';

import type { StockMovement } from '@/components/inventory2/types';

interface MovementItemProps {
  movement: StockMovement;
}

export function MovementItem({ movement: m }: MovementItemProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
            m.type === 'IN' ? 'bg-emerald-500/20 text-emerald-300' :
            m.type === 'OUT' ? 'bg-red-500/20 text-red-300' :
            'bg-amber-500/20 text-amber-300'
          }`}>
            {m.type === 'IN' ? 'و' : m.type === 'OUT' ? 'ص' : 'ت'}
          </span>
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{m.product?.name || `منتج #${m.product_id}`}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                m.type === 'IN' ? 'bg-emerald-500/20 text-emerald-300' :
                m.type === 'OUT' ? 'bg-red-500/20 text-red-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {m.type === 'IN' ? 'وارد' : m.type === 'OUT' ? 'صادر' : 'تسوية'}
              </span>
              {m.notes && <span className="text-xs text-[#ecfdf5]0">{m.notes}</span>}
              {m.reference_type && <span className="text-xs text-[#ecfdf5]0">مرجع: {m.reference_type}</span>}
            </div>
          </div>
        </div>
        <div className="text-left shrink-0 mr-4">
          <span className={`text-xl font-black ${m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
            {m.type === 'IN' ? '+' : '-'}{Number(m.quantity).toLocaleString()}
          </span>
          <p className="text-xs text-[#ecfdf5]0 mt-0.5">
            {m.date ? new Date(m.date).toLocaleDateString('ar-EG') : m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
