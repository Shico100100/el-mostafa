# Task 2: Create `lib/resolveRoles.ts`

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
