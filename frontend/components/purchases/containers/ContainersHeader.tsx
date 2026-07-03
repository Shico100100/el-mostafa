'use client';

import { Package } from 'lucide-react';

export function ContainersHeader({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package className="w-6 h-6" /> إدارة الحاويات</h1>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">العودة</button>
          <button onClick={onAdd} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 transition">+ حاوية جديدة</button>
        </div>
      </div>
    </header>
  );
}
