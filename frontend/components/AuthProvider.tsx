'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/login/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const normalizedPath = pathname.replace(/\/+$/, '');

  useEffect(() => {
    if (PUBLIC_PATHS.includes(normalizedPath)) {
      setReady(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, [pathname, router, normalizedPath]);

  if (!ready && !PUBLIC_PATHS.includes(normalizedPath)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
