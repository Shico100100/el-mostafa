'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BOMsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bom');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
      <div className="text-white text-xl">جاري التوجيه إلى صفحة BOM الموحدة...</div>
    </div>
  );
}
