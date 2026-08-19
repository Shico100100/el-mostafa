'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/lib/useAuthCheck';

export default function HomePage() {
  const ready = useAuthCheck();
  const router = useRouter();

  useEffect(() => {
    if (ready) {
      router.push('/dashboard');
    }
  }, [ready, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );
}
