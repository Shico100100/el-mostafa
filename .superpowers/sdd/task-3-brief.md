# Task 3: Update `lib/usePermission.ts`

**Files:**
- Modify: `frontend/lib/usePermission.ts`

**Interfaces:**
- Consumes: existing `UserRole` enum, `jwtDecode`
- Produces: adds `Viewer` to enum, adds `isViewer`, `isWorker` to return object

- [ ] **Step 1: Add `VIEWER` to enum and add new helpers**

Add `VIEWER = 'Viewer'` to the `UserRole` enum in `frontend/lib/usePermission.ts`.

Add these lines before the `return` statement:

```typescript
    const isViewer = isStorekeeper || role === UserRole.VIEWER || roleId === 7;
    const isWorker = isViewer || role === UserRole.WORKER || roleId === 6;
```

Update the return statement to include the new fields:

```typescript
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
