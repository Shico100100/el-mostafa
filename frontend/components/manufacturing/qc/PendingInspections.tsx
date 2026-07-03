'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { PendingProduction } from '@/components/manufacturing/qc/types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  pending: PendingProduction[];
}

export function PendingInspections({ pending }: Props) {
  if (pending.length === 0) return null;

  return (
    <GlassPanel title={<span className="flex items-center gap-2"><AlertTriangle /> فحوصات معلقة</span>}>
      <div className="space-y-2">
        {pending.map((p) => (
          <div key={p.id} className="flex justify-between items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
            <div>
              <span className="text-white font-medium">{p.machine?.name || `إنتاج #${p.id}`}</span>
              <span className="text-gray-400 mr-4">{p.mold?.name || ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">{p.pieces_produced} قطعة</span>
              <span className="text-amber-300 text-sm bg-amber-500/20 px-3 py-1 rounded-full">معلق</span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
