'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PageShell({ title, subtitle, backHref, actions, children }: {
  title: string; subtitle?: string; backHref?: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {backHref && (
              <button onClick={() => router.push(backHref)} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-white">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 font-mono">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </>
  );
}
