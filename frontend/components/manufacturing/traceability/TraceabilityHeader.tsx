'use client';

import { useRouter } from 'next/navigation';
import { Link } from 'lucide-react';

interface Props {
  onCreateBatch: () => void;
}

export function TraceabilityHeader({ onCreateBatch }: Props) {
  const router = useRouter();

  return (
    <header className="glass border-b border-white/5 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Link />
          تتبع الإنتاج (Traceability)
        </h1>
        <div className="flex gap-3">
          <button onClick={onCreateBatch} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition text-sm font-bold">
            + إنشاء دفعة
          </button>
          <button onClick={() => router.push('/manufacturing')} className="text-slate-400 hover:text-white transition">
            العودة
          </button>
        </div>
      </div>
    </header>
  );
}
