# Task 2: RBAC — Protect Endpoints with @Roles()

## Context
Task 2 of 8 in Phase 5. The existing `@Roles()` decorator (from `backend/src/roles/roles.decorator.ts`) takes `number[]` (role IDs). The `RolesGuard` is at `backend/src/roles/roles.guard.ts`. RoleEnum values: admin=1, manager=3, worker=6, viewer=7.

## What to do
Add RBAC protection to 8 controllers. Pattern: add `@UseGuards(JwtAuthGuard, RolesGuard)` at class level + `@Roles(...)` with appropriate role IDs.

### Role mapping (from RoleEnum):
- admin = RoleEnum.admin (1)
- manager = RoleEnum.manager (3)
- worker = RoleEnum.worker (6)
- viewer = RoleEnum.viewer (7)

### Files to modify:

#### 1. Dashboard controller
**File:** `backend/src/dashboard/dashboard.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)`
- Already has `@UseGuards(JwtAuthGuard)` — replace/append

#### 2. Inventory controller
**File:** `backend/src/inventory/inventory.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)`

#### 3. Sales controller
**File:** `backend/src/sales/sales.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager)`

#### 4. Purchases controller
**File:** `backend/src/purchases/purchases.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager)`

#### 5. Notifications controller
**File:** `backend/src/notifications/notifications.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager)`
- NOTE: This controller has `@Public()` on some routes — `@Public()` bypasses JWT. RolesGuard will still check if a user is present. Existing `@Public()` routes should remain public (RolesGuard returns true when no roles are required for that handler, but since we're setting class-level roles... Actually, the RolesGuard uses `getAllAndOverride` which checks both class and handler metadata. If a method has `@Public()` but no `@Roles()`, it will inherit class-level roles. Need to handle this.)

Actually, let me reconsider. The `@Public()` decorator sets metadata `isPublic: true` which the JwtAuthGuard checks. The RolesGuard only runs after JwtAuthGuard passes. So if a route is `@Public()`, JwtAuthGuard skips it, and the request won't have a `user` object. Then RolesGuard will try to access `user?.role?.id` which will be undefined, and the guard will deny access because the role doesn't match.

So for `@Public()` routes, we need those methods to not have roles checked. The existing RolesGuard uses `getAllAndOverride` which checks BOTH class and handler metadata. If a handler has no `@Roles()`, it inherits from the class, which means ALL routes on the controller get the class-level protection.

One approach: Make the RolesGuard check if the JwtAuthGuard skipped auth (i.e., no user), and if so, pass through. This way public routes remain public.

Actually, the simplest approach is: the RolesGuard should allow requests with no authenticated user (public endpoints). Let me modify the guard logic slightly:
```typescript
canActivate(context: ExecutionContext): boolean {
  const roles = this.reflector.getAllAndOverride<(number | string)[]>('roles', [
    context.getClass(),
    context.getHandler(),
  ]);
  if (!roles || !roles.length) return true;
  const request = context.switchToHttp().getRequest();
  if (!request.user) return true; // Allow public routes
  return roles.map(String).includes(String(request.user?.role?.id));
}
```

Wait, but this would mean anyone can access these routes even without auth. The JwtAuthGuard handles that - if the route doesn't have @Public(), JwtAuthGuard requires auth. If it has @Public(), JwtAuthGuard allows without auth. And then RolesGuard should allow without a user (since the route is public).

Actually no - if a method is public but has class-level @Roles(), we don't want roles checked. The simplest fix is: add `@Roles()` (empty) or no `@Roles()` on the method to override the class-level roles. But the existing RolesGuard returns true when roles are empty, so:

```typescript
@Public()
@Roles() // empty - overrides class-level roles, guard returns true
@Get('unread-count')
getUnreadCount() { ... }
```

Hmm, but `@Roles()` with no arguments would mean the handler has `roles: []` which is truthy (empty array) and `!roles.length` is true, so the guard returns true. That works.

Actually, let me just modify the notifications controller without class-level roles, and instead add method-level @Roles to the methods that should be protected. That's cleaner.

Actually, the simplest approach is:

For controllers with @Public() methods (notifications):
- Don't use class-level @Roles
- Add @Roles + @UseGuards(RolesGuard) to each non-public method

OR: Modify RolesGuard to skip when no user exists (public endpoints).

I think modifying RolesGuard is cleaner. Let me add a simple check.

#### 6. Currency controller
**File:** `backend/src/currency/currency.controller.ts`
- Add imports: `JwtAuthGuard`, `RolesGuard`, `Roles`, `RoleEnum`  
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin)`

#### 7. Documents controller
**File:** `backend/src/documents/documents.controller.ts`
- Add imports: `JwtAuthGuard`, `RolesGuard`, `Roles`, `RoleEnum`
- Class-level: `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(RoleEnum.admin, RoleEnum.manager)`

#### 8. Manufacturing controller
**File:** `backend/src/manufacturing/manufacturing.controller.ts`
- Add imports: `RolesGuard`, `Roles`, `RoleEnum`
- Add class-level `@UseGuards(JwtAuthGuard, RolesGuard)`
- For the Worker role: Identify the "daily production" POST method
  - On that method ONLY: `@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.worker)`
  - Class-level: `@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)`
  - Method-level @Roles overrides class-level

## Steps
1. Modify the RolesGuard to allow requests without authenticated user (needed for @Public() routes from notifications controller)
2. Apply @Roles() + @UseGuards(RolesGuard) to all 8 controllers
3. Run `npx tsc --noEmit`
4. Run `npm test` (existing tests)
5. Commit

## Imports to use
```typescript
import { Roles } from '../roles/roles.decorator'; // adjust relative path
import { RolesGuard } from '../roles/roles.guard'; // adjust relative path
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport'; // or JwtAuthGuard for some
```

## Commit message
```
feat(rbac): protect all endpoints with @Roles decorator
```

## Report
Write report to `C:\ELMostafa\.superpowers\reports\task-2-report.md`
