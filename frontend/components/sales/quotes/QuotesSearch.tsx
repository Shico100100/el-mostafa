'use client';

import { Search } from 'lucide-react';

interface QuotesSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export function QuotesSearch({ value, onChange }: QuotesSearchProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text" placeholder="بحث برقم عرض السعر أو اسم العميل..."
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
        />
      </div>
    </div>
  );
}
