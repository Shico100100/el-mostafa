'use client';

import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccountingHeader() {
  const router = useRouter();

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          الحسابات العامة
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/accounting/journal')}
            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl border border-emerald-500/20 transition flex items-center gap-2 font-bold"
          >
            <FileText className="w-4 h-4" />
            قيود اليومية
          </button>
        </div>
      </div>
    </header>
  );
}
