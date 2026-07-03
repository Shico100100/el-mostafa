'use client';

import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

export function AssemblyHeader({ onNewOrder }: { onNewOrder: () => void }) {
  const router = useRouter();

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings /> أوامر التجميع والإنتاج</h1>
        <div className="flex gap-3">
          <button onClick={onNewOrder}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition">
            + أمر تجميع جديد
          </button>
          <button onClick={() => router.push('/manufacturing')}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">
            العودة للتصنيع
          </button>
        </div>
      </div>
    </header>
  );
}
