'use client';

import { useRouter } from 'next/navigation';
import { STATUS_MAP } from '@/components/manufacturing/traceability/types';
import type { Batch } from '@/components/manufacturing/traceability/types';
import { Package } from 'lucide-react';

interface Props {
  batch: Batch;
}

export function BatchCard({ batch }: Props) {
  const router = useRouter();
  const b = batch;

  const statusInfo = STATUS_MAP[b.status] || { label: b.status, color: 'bg-white/5 text-slate-300' };

  return (
    <div
      onClick={() => router.push(`/manufacturing/traceability/${b.id}`)}
      className="glass p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl"><Package /></div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-bold text-blue-300">{b.batch_number}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <div className="text-sm text-slate-400">
            {b.product?.name || '—'} — {Number(b.quantity).toLocaleString()} {b.unit}
          </div>
        </div>
      </div>
      <div className="text-left text-sm text-slate-500">
        <div>{new Date(b.production_date).toLocaleDateString('ar-EG')}</div>
        {b.expiry_date && (
          <div className={`text-xs ${new Date(b.expiry_date) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
            ينتهي: {new Date(b.expiry_date).toLocaleDateString('ar-EG')}
          </div>
        )}
      </div>
    </div>
  );
}
