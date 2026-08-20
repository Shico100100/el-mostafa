'use client';

import { useRouter } from 'next/navigation';

export function SettingsHeader() {
  const router = useRouter();

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg transition">
          العودة للرئيسية
        </button>
      </div>
    </header>
  );
}
