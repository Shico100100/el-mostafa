# Frontend RBAC UI Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate sidebar menu items and page access by user role (ADMIN, MANAGER, WORKER, VIEWER, etc.)

**Architecture:** Centralized permission map (`lib/permissions.ts`) + longest-prefix-match resolver (`lib/resolveRoles.ts`) + no-prop `ProtectedPage` component wired into `GlobalSidebar` to guard all pages automatically. Sidebar filters items using the same map.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, lucide-react

## Global Constraints

- All new files go in `frontend/`
- Follow existing code style (Arabic labels, lucide-react icons, Tailwind)
- `ProtectedPage` reads permissions from `PAGE_PERMISSIONS` using current pathname — no props
- Longest prefix match: `/sales/orders/123` resolves to `/sales/orders` key
- Login page (`/login`) is excluded from gating
- Use role IDs from `RoleEnum` (1=admin, 3=manager, 4=accountant, 5=storekeeper, 6=worker, 7=viewer)

---
## Task 1: Create `lib/permissions.ts`

**Files:**
- Create: `frontend/lib/permissions.ts`
- Verify: `frontend/lib/permissions.ts` reads correctly

**Interfaces:**
- Consumes: nothing (standalone data file)
- Produces: `PAGE_PERMISSIONS` constant exported as `Record<string, number[]>`

- [ ] **Step 1: Create the file**

```typescript
// Role IDs: 1=admin, 2=user, 3=manager, 4=accountant, 5=storekeeper, 6=worker, 7=viewer
export const PAGE_PERMISSIONS: Record<string, number[]> = {
  '/dashboard': [1, 3, 4, 5, 6, 7],
  '/sales': [1, 3],
  '/sales/orders': [1, 3],
  '/sales/customers': [1, 3],
  '/sales/quotes': [1, 3],
  '/sales/returns': [1, 3],
  '/sales/customers/statement': [1, 3],
  '/purchases': [1, 3, 4],
  '/purchases/suppliers': [1, 3, 4],
  '/purchases/suppliers/statement': [1, 3, 4],
  '/purchases/orders': [1, 3, 4],
  '/purchases/returns': [1, 3, 4],
  '/purchases/currencies': [1],
  '/purchases/containers': [1, 3, 4],
  '/inventory2': [1, 3, 5, 6],
  '/inventory2/products': [1, 3, 5, 6],
  '/inventory2/products/bulk-prices': [1, 3, 5],
  '/inventory2/semi-finished': [1, 3, 5, 6],
  '/inventory2/stock': [1, 3, 5, 6],
  '/inventory2/stock/movements': [1, 3, 5, 6],
  '/inventory2/stock/transfer': [1, 3, 5, 6],
  '/inventory2/stock/adjust': [1, 3, 5],
  '/inventory2/warehouses': [1, 3, 5],
  '/manufacturing': [1, 3, 5, 6],
  '/manufacturing/raw-materials': [1, 3, 5, 6],
  '/manufacturing/molds': [1, 3, 5, 6],
  '/manufacturing/machines': [1, 3, 5, 6],
  '/manufacturing/boms': [1, 3, 5, 6],
  '/manufacturing/production': [1, 3, 6],
  '/manufacturing/daily-production': [1, 3, 6],
  '/manufacturing/planning': [1, 3, 5, 6],
  '/manufacturing/schedule': [1, 3, 5, 6],
  '/manufacturing/qc': [1, 3, 5],
  '/manufacturing/assembly': [1, 3, 5, 6],
  '/manufacturing/maintenance': [1, 3, 6],
  '/manufacturing/kiosk': [1, 3, 6],
  '/manufacturing/mrp': [1, 3, 5],
  '/manufacturing/feasibility': [1, 3, 5],
  '/manufacturing/traceability': [1, 3, 5, 6],
  '/manufacturing/fixed-costs': [1, 3, 4],
  '/bom': [1, 3, 5, 6],
  '/assembly': [1, 3, 5, 6],
  '/assembly/production': [1, 3, 6],
  '/assembly/attendance': [1, 3, 6],
  '/assembly/accessories': [1, 3, 5, 6],
  '/assembly/plastic': [1, 3, 5, 6],
  '/assembly/packaging': [1, 3, 5, 6],
  '/assembly/bom': [1, 3, 5, 6],
  '/accounting': [1, 3, 4],
  '/accounting/journal': [1, 3, 4],
  '/hr': [1, 3],
  '/hr/payroll': [1, 3],
  '/hr/employees': [1, 3],
  '/reports': [1, 3, 4, 5, 7],
  '/reports/production': [1, 3, 4, 5, 7],
  '/notifications': [1, 3, 4, 5, 6, 7],
  '/documents': [1, 3, 4, 5, 6, 7],
  '/users': [1],
  '/settings': [1, 3],
  '/audit': [1],
  '/dashboard/control-tower': [1, 3],
};
```

- [ ] **Step 2: Verify file reads correctly**

Run: `cd frontend; npx tsc --noEmit --strict lib/permissions.ts`

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/permissions.ts
git commit -m "feat(rbac): add permission map for all routes"
```

## Task 2: Create `lib/resolveRoles.ts`

**Files:**
- Create: `frontend/lib/resolveRoles.ts`

**Interfaces:**
- Consumes: `PAGE_PERMISSIONS` from `@/lib/permissions`
- Produces: `resolveRoles(pathname: string): number[]` (always returns `number[]` — empty `[]` means public)

- [ ] **Step 1: Create the file**

```typescript
import { PAGE_PERMISSIONS } from '@/lib/permissions';

export function resolveRoles(pathname: string): number[] {
  const keys = Object.keys(PAGE_PERMISSIONS)
    .filter(k => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length);

  return keys.length > 0 ? PAGE_PERMISSIONS[keys[0]] : [];
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/resolveRoles.ts
git commit -m "feat(rbac): add longest-prefix path resolver"
```

## Task 3: Update `lib/usePermission.ts`

**Files:**
- Modify: `frontend/lib/usePermission.ts`

**Interfaces:**
- Consumes: existing `UserRole` enum, `jwtDecode`
- Produces: adds `Viewer` to enum, adds `isViewer`, `isWorker` to return object

- [ ] **Step 1: Add `VIEWER` to enum and add new helpers**

Edit `frontend/lib/usePermission.ts`:

```typescript
export enum UserRole {
    ADMIN = 'Admin',
    MANAGER = 'Manager',
    ACCOUNTANT = 'Accountant',
    STOREKEEPER = 'Storekeeper',
    WORKER = 'Worker',
    VIEWER = 'Viewer',
    USER = 'User',
}
```

Add at the end of the hook, before the return:

```typescript
    const isViewer = isStorekeeper || role === UserRole.VIEWER || roleId === 7;
    const isWorker = isViewer || role === UserRole.WORKER || roleId === 6;

    return { role, roleId, hasRole, isAdmin, isManager, isAccountant, isStorekeeper, isWorker, isViewer };
```

- [ ] **Step 2: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/usePermission.ts
git commit -m "feat(rbac): add Viewer role to usePermission hook"
```

## Task 4: Create `components/ProtectedPage.tsx`

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

## Task 5: Wire ProtectedPage into GlobalSidebar

**Files:**
- Modify: `frontend/components/GlobalSidebar.tsx`

- [ ] **Step 1: Add imports and wire ProtectionPage**

Edit `frontend/components/GlobalSidebar.tsx`:

Add import at top (after existing imports):
```tsx
import { usePermission } from '@/lib/usePermission';
import { resolveRoles } from '@/lib/resolveRoles';
```

Add inside the component function, after the login check:
```tsx
  const { roleId } = usePermission();
  const allowedModules = useMemo(() => {
    return modules.filter(mod => {
      const roles = resolveRoles(mod.href);
      return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
    });
  }, [roleId]);
```

Add a filter for each module's children:
```typescript
// In the module rendering loop, filter children:
const visibleChildren = mod.children?.filter(child => {
  const roles = resolveRoles(child.href);
  return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
}) ?? [];
```

Replace `{hasChildren && expanded && (...{mod.children!.map(...)}` with:
```tsx
{visibleChildren.length > 0 && expanded && (
  <div className="mr-4 mt-0.5 space-y-0.5 border-r border-white/10 pr-2">
    {visibleChildren.map((child) => { ...existing child render code... })}
  </div>
)}
```

If `visibleChildren.length === 0`, don't show the expand arrow and don't render the children section.

Also, wrap `{children}` in ProtectedPage at the end:

Edit the main content section:
```tsx
      <main className="flex-1 min-w-0">
        <ProtectedPage>{children}</ProtectedPage>
      </main>
```

Add the import for ProtectedPage:
```tsx
import ProtectedPage from '@/components/ProtectedPage';
```

Note: Also need to add `useMemo` to the react import:
```tsx
import { useState, useMemo } from 'react';
```

- [ ] **Step 2: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/components/GlobalSidebar.tsx
git commit -m "feat(rbac): wire sidebar and page gating into GlobalSidebar"
```

## Task 6: Self-review & Verification

- [ ] **Step 1: Full typecheck**

```bash
cd frontend; npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 2: Start frontend**

```bash
cd frontend; npx next dev -H 0.0.0.0
```
Expected: app starts on port 3000, no compilation errors

- [ ] **Step 3: Quick manual check (against running backend)**

Open browser at http://localhost:3000, login as viewer@admin.com / admin123
Expected: sidebar shows only Dashboard, Reports, Notifications, Documents
Navigate to /users — expected: redirect to /dashboard
Navigate to /sales — expected: redirect to /dashboard
Navigate to /reports — expected: stays on /reports

Login as worker@admin.com / admin123
Expected: sidebar shows manufacturing/inventory items
Navigate to /users — expected: redirect to /dashboard
Navigate to /manufacturing/daily-production — expected: stays

Login as admin@admin.com / admin123
Expected: sidebar shows everything

- [ ] **Step 4: Commit if any fixes needed**

## Task 7: Whole-branch Review & Merge

- [ ] **Step 1: Request code review** using requesting-code-review skill
- [ ] **Step 2: Address feedback**
- [ ] **Step 3: Final commit and merge**
