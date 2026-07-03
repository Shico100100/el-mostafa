'use client';

interface TotalRow {
  type: string;
  total: number;
}

interface Props {
  totals: TotalRow[];
}

export function TrialBalanceSummary({ totals }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden h-fit">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-xl font-bold text-white">ميزان المراجعة (ملخص)</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {totals.map(({ type, total }) => (
            <div key={type} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">{type}</span>
              <span className={`font-mono font-bold ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
