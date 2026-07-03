'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssemblyBOMRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bom');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
      <div className="text-white text-xl">جاري التوجيه إلى صفحة BOM الموحدة...</div>
    </div>
  );
}
