'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermission } from '@/lib/usePermission';
import { resolveRoles } from '@/lib/resolveRoles';

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { roleId } = usePermission();
  const pathname = usePathname();
  const router = useRouter();

  const allowedRoles = useMemo(() => resolveRoles(pathname), [pathname]);
  const hasAccess = allowedRoles.length === 0 || (roleId != null && allowedRoles.includes(roleId as number));

  useEffect(() => {
    if (!hasAccess && roleId != null) {
      router.replace('/dashboard');
    }
  }, [hasAccess, roleId, router]);

  if (hasAccess) return <>{children}</>;
  return null;
}
