'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BOMsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bom');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white text-xl">جاري التوجيه إلى صفحة BOM الموحدة...</div>
    </div>
  );
}
