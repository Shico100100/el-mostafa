'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurrenciesHeaderProps {
  onAdd: () => void;
}

export function CurrenciesHeader({ onAdd }: CurrenciesHeaderProps) {
  const router = useRouter();
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowLeftRight className="w-6 h-6" /> إدارة العملات</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push('/purchases')}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">العودة</button>
          <button onClick={onAdd}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition">+ عملة جديدة</button>
        </div>
      </div>
    </header>
  );
}
