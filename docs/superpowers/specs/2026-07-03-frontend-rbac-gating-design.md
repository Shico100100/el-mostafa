# Frontend RBAC UI Gating

**Date:** 2026-07-03

## Problem

Backend RBAC is complete — endpoints protected with `@Roles()` decorator. But the frontend still shows all sidebar items and pages to every user. A VIEWER can see and click "Users", "Audit", "Settings" etc. even though the backend will reject the requests.

## Solution

Two-level gating using a centralized permission map:

### Level 1: Sidebar (UX)

`GlobalSidebar.tsx` filters menu items per role — items the user can't access simply don't appear.

### Level 2: Page-level (Security)

`ProtectedPage` component wraps each page, reads current pathname, resolves allowed roles from the permission map, and redirects to `/dashboard` if unauthorized.

## Architecture

### 1. `lib/permissions.ts` — Central Permission Map

```typescript
import { RoleEnum } from './role-enum';

export const PAGE_PERMISSIONS: Record<string, RoleEnum[]> = {
  '/dashboard': [1, 3, 4, 5, 6, 7],           // all
  '/sales': [1, 3],                             // admin, manager
  '/sales/orders': [1, 3],
  '/sales/customers': [1, 3],
  '/sales/quotes': [1, 3],
  '/sales/returns': [1, 3],
  '/purchases': [1, 3, 4],                      // + accountant
  '/purchases/suppliers': [1, 3, 4],
  '/purchases/orders': [1, 3, 4],
  '/purchases/returns': [1, 3, 4],
  '/purchases/currencies': [1],                 // admin only
  '/purchases/containers': [1, 3, 4],
  '/inventory2': [1, 3, 5, 6],                 // + storekeeper, worker
  '/inventory2/products': [1, 3, 5, 6],
  '/inventory2/semi-finished': [1, 3, 5, 6],
  '/inventory2/stock': [1, 3, 5, 6],
  '/inventory2/stock/movements': [1, 3, 5, 6],
  '/inventory2/warehouses': [1, 3, 5, 6],
  '/manufacturing': [1, 3, 5, 6],
  '/bom': [1, 3, 5, 6],
  '/manufacturing/machines': [1, 3, 5, 6],
  '/manufacturing/molds': [1, 3, 5, 6],
  '/manufacturing/raw-materials': [1, 3, 5, 6],
  '/manufacturing/daily-production': [1, 3, 6],  // worker needs this
  '/manufacturing/planning': [1, 3, 5, 6],
  '/manufacturing/qc': [1, 3, 5, 6],
  '/manufacturing/assembly': [1, 3, 5, 6],
  '/assembly/accessories': [1, 3, 5, 6],
  '/assembly/production': [1, 3, 6],
  '/assembly/attendance': [1, 3, 6],
  '/assembly/packaging': [1, 3, 5, 6],
  '/assembly/plastic': [1, 3, 5, 6],
  '/manufacturing/maintenance': [1, 3, 6],
  '/manufacturing/mrp': [1, 3, 5],
  '/manufacturing/feasibility': [1, 3, 5],
  '/manufacturing/traceability': [1, 3, 5, 6],
  '/manufacturing/fixed-costs': [1, 3, 4],
  '/accounting': [1, 3, 4],
  '/accounting/journal': [1, 3, 4],
  '/hr': [1, 3],
  '/hr/payroll': [1, 3],
  '/hr/employees': [1, 3],
  '/reports': [1, 3, 4, 5, 7],                  // viewer reads reports
  '/reports/production': [1, 3, 4, 5, 7],
  '/notifications': [1, 3, 4, 5, 6, 7],         // all authenticated
  '/users': [1],                                 // admin only
  '/settings': [1, 3],
  '/audit': [1],
};
```

### 2. `lib/resolveRoles.ts` — Longest Prefix Match

```typescript
export function resolveRoles(pathname: string): RoleEnum[] {
  const keys = Object.keys(PAGE_PERMISSIONS)
    .filter(k => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length);

  return keys.length > 0 ? PAGE_PERMISSIONS[keys[0]] : [];
}
```

Uses descending length sort so `/sales/orders` matches before `/sales` for paths like `/sales/orders/123`.

### 3. `lib/usePermission.ts` — Update

- Add `VIEWER = 'Viewer'` to enum
- Export `isViewer` boolean
- Add `roleId` return

### 4. `components/ProtectedPage.tsx` — No Props

```tsx
'use client';
export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { roleId } = usePermission();
  const pathname = usePathname();
  const router = useRouter();

  const allowedRoles = useMemo(() => resolveRoles(pathname), [pathname]);
  const hasAccess = allowedRoles.length === 0 || (roleId && allowedRoles.includes(roleId as RoleEnum));

  useEffect(() => {
    if (!hasAccess && roleId != null) router.replace('/dashboard');
  }, [hasAccess, roleId, router]);

  if (hasAccess) return <>{children}</>;
  return null;
}
```

Key points:
- No `allowedRoles` prop — reads from `PAGE_PERMISSIONS` automatically
- If pathname isn't in the map, defaults to accessible (public)
- Redirects only if user is logged in but unauthorized
- Returns null during redirect to avoid flash

### 5. `GlobalSidebar.tsx` — Filter Menu Items

Add `usePermission()` call, filter `modules` array using `resolveRoles(mod.href)`. If a section has children, filter children too. If a section ends up with zero visible children (and is a section), hide the entire section.

### 6. Rollout Pattern

Wrap each page's default export:
```tsx
export default function SomePage() {
  return (
    <ProtectedPage>
      {/* existing page content */}
    </ProtectedPage>
  );
}
```

No file needs to know its own permission — the URL handles it.

## Files Changed

| File | Change |
|------|--------|
| `frontend/lib/permissions.ts` | New — permission map |
| `frontend/lib/resolveRoles.ts` | New — longest prefix matcher |
| `frontend/components/ProtectedPage.tsx` | New — page guard |
| `frontend/lib/usePermission.ts` | Add Viewer, isViewer, isWorker |
| `frontend/components/GlobalSidebar.tsx` | Filter menu by role |
| `frontend/app/(pages)/*/page.tsx` | Wrap in ProtectedPage |
| Each `frontend/app/*/page.tsx` | Wrap in ProtectedPage (page level, not layout — login needs to be excluded) |

## Edge Cases

- **Public pages** (e.g., `/login`): not in `PAGE_PERMISSIONS` → resolveRoles returns `[]` → ProtectedPage allows access
- **Unknown routes**: same as public → allowed
- **Logged out users**: `roleId` is null → `hasAccess` is false → no redirect (because not logged in) — login page handles auth
- **Worker can't list**: redirects to dashboard with no sidebar items visible → worker sees only their permitted menu
