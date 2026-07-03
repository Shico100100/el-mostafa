'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface Props {
  onNewInspection: () => void;
}

export function QCHeader({ onNewInspection }: Props) {
  const router = useRouter();

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/manufacturing')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl"><ArrowRight /></button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CheckCircle /> مراقبة الجودة</h1>
        </div>
        <button
          onClick={onNewInspection}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-sm"
        >
          + فحص جديد
        </button>
      </div>
    </header>
  );
}
