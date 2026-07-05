# Task 4: Create `components/ProtectedPage.tsx`

**Files:**
- Create: `frontend/components/ProtectedPage.tsx`

**Interfaces:**
- Consumes: `usePermission()` from `@/lib/usePermission`, `resolveRoles()` from `@/lib/resolveRoles`
- Produces: `<ProtectedPage>` component — no props, reads permissions from pathname

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ProtectedPage.tsx
git commit -m "feat(rbac): add ProtectedPage guard component"
```
