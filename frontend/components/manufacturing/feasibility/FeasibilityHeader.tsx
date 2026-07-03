'use client';

import { ArrowRight, Search } from 'lucide-react';

interface FeasibilityHeaderProps {
  onBack: () => void;
}

export function FeasibilityHeader({ onBack }: FeasibilityHeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl"><ArrowRight /></button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Search /> تحليل جدوى الإنتاج</h1>
        </div>
      </div>
    </header>
  );
}
