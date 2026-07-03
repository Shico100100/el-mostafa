'use client';

import { PERIODS, periodLabel } from '@/components/manufacturing/entry-log/types';

interface Props {
  value: string;
  onChange: (p: string) => void;
}

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="mb-6 flex gap-2">
      {PERIODS.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${value === p ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          {periodLabel(p)}
        </button>
      ))}
    </div>
  );
}
