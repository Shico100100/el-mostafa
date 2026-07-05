# Task 1: RBAC — Add VIEWER Role & Seed Users

## Context
ELMostafa ERP — Task 1 of 8. The codebase already has:
- `backend/src/roles/roles.enum.ts` with `admin=1, user=2, manager=3, accountant=4, storekeeper=5, worker=6`
- `backend/src/roles/roles.guard.ts` — `RolesGuard` that checks `request.user?.role?.id` against metadata
- `backend/src/roles/roles.decorator.ts` — `@Roles(...roles: number[])` decorator

So we just need to add `viewer=7` to `RoleEnum`, and seed users with the new roles.

## Files to modify
- Modify: `backend/src/roles/roles.enum.ts` (add viewer)
- Modify: `backend/src/database/seeds/relational/user/user-seed.service.ts` (add manager/worker/viewer users)
- Modify: `backend/src/roles/roles.decorator.ts` (add JSDoc or improve typing — optional)

## What NOT to do
- Do NOT create a new Role enum file — use the existing RoleEnum
- Do NOT create a new RolesGuard or Roles decorator — they already exist
- Do NOT modify user.entity.ts — it already has a `role` ManyToOne relationship
- Do NOT modify app.module.ts — RolesGuard is likely already registered

## Steps

### Step 1: Add VIEWER to RoleEnum
```typescript
// src/roles/roles.enum.ts
export enum RoleEnum {
  'admin' = 1,
  'user' = 2,
  'manager' = 3,
  'accountant' = 4,
  'storekeeper' = 5,
  'worker' = 6,
  'viewer' = 7,
}
```

### Step 2: Seed manager/worker/viewer users
In `user-seed.service.ts`, after the existing users, add:
```typescript
// Manager user
const existingManager = await this.repository.findOne({
  where: { email: 'manager@admin.com' },
});
if (!existingManager) {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('admin123', salt);
  await this.repository.save(
    this.repository.create({
      firstName: 'Manager',
      lastName: 'Account',
      email: 'manager@admin.com',
      password,
      role: { id: RoleEnum.manager, name: 'Manager' },
      status: { id: StatusEnum.active, name: 'Active' },
    }),
  );
}

// Worker user
const existingWorker = await this.repository.findOne({
  where: { email: 'worker@admin.com' },
});
if (!existingWorker) {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('admin123', salt);
  await this.repository.save(
    this.repository.create({
      firstName: 'Worker',
      lastName: 'Account',
      email: 'worker@admin.com',
      password,
      role: { id: RoleEnum.worker, name: 'Worker' },
      status: { id: StatusEnum.active, name: 'Active' },
    }),
  );
}

// Viewer user
const existingViewer = await this.repository.findOne({
  where: { email: 'viewer@admin.com' },
});
if (!existingViewer) {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('admin123', salt);
  await this.repository.save(
    this.repository.create({
      firstName: 'Viewer',
      lastName: 'Account',
      email: 'viewer@admin.com',
      password,
      role: { id: RoleEnum.viewer, name: 'Viewer' },
      status: { id: StatusEnum.active, name: 'Active' },
    }),
  );
}
```

### Step 3: Typecheck
```bash
cd C:\ELMostafa\backend; npx tsc --noEmit
```
Expected: No errors

### Step 4: Commit
```bash
git add backend/src/roles/roles.enum.ts backend/src/database/seeds/relational/user/user-seed.service.ts
git commit -m "feat(rbac): add viewer role and seed manager/worker/viewer users"
```

## Global Constraints
- DATABASE_SYNCHRONIZE=false permanently
- Follow existing codebase patterns exactly

## Report
Write report to `C:\ELMostafa\.superpowers\reports\task-1-report.md`
Report back: Status (✅/❌), Commits (full sha), one-line summary
