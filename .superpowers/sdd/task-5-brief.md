# Task 5: Wire ProtectedPage into GlobalSidebar

**Files:**
- Modify: `frontend/components/GlobalSidebar.tsx`

**Produces:**
- Sidebar menu items filtered by role
- Page-level gating via ProtectedPage wrapper around all children
- Login page (`/login`) excluded from gating

## Steps

- [ ] **Step 1: Add imports**

Add at top of `frontend/components/GlobalSidebar.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { usePermission } from '@/lib/usePermission';
import { resolveRoles } from '@/lib/resolveRoles';
import ProtectedPage from '@/components/ProtectedPage';
```

Note: Change the existing `import { useState } from 'react';` to include `useMemo`.

- [ ] **Step 2: Add role filtering inside component**

After the login check (line: `if (pathname === '/login') return <>{children}</>;`), add:

```typescript
  const { roleId } = usePermission();
  const allowedModules = useMemo(() => {
    return modules.filter(mod => {
      const roles = resolveRoles(mod.href);
      return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
    });
  }, [roleId]);
```

- [ ] **Step 3: Filter menu items in the render**

Replace the `modules.map` line:
```tsx
          {modules.map((mod) => {
```
with:
```tsx
          {allowedModules.map((mod) => {
```

- [ ] **Step 4: Filter children per module**

Inside the module rendering, replace the children loop to filter by role:

Find this pattern:
```tsx
                    {mod.children!.map((child) => {
```
Replace with:
```tsx
                    {mod.children!.filter(child => {
                      const roles = resolveRoles(child.href);
                      return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
                    }).map((child) => {
```

- [ ] **Step 5: Wrap children in ProtectedPage**

Replace this:
```tsx
      <main className="flex-1 min-w-0">
        {children}
      </main>
```
with:
```tsx
      <main className="flex-1 min-w-0">
        <ProtectedPage>{children}</ProtectedPage>
      </main>
```

- [ ] **Step 6: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add frontend/components/GlobalSidebar.tsx
git commit -m "feat(rbac): wire sidebar filtering and page gating"
```
