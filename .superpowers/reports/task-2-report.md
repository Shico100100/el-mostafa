# Task 2 Report — Protect 8 controllers with `@Roles()` decorator and `RolesGuard`

**Status:** ✅ Complete

## Changes Made

### 1. RolesGuard improvement (`backend/src/roles/roles.guard.ts`)
- Added `if (!request.user) return true;` to allow public routes to pass through (JwtAuthGuard already handles `@Public()`)

### 2. Controller protections

| Controller | Guard | Roles |
|---|---|---|
| `DashboardController` | `JwtAuthGuard, RolesGuard` | `admin, manager, viewer` |
| `InventoryController` | `JwtAuthGuard, RolesGuard` | `admin, manager, viewer` |
| `SalesController` | `JwtAuthGuard, RolesGuard` | `admin, manager` |
| `PurchasesController` | `JwtAuthGuard, RolesGuard` | `admin, manager` |
| `NotificationsController` | `JwtAuthGuard, RolesGuard` | `admin, manager` |
| `CurrencyController` | `JwtAuthGuard, RolesGuard` | `admin` |
| `DocumentsController` | `JwtAuthGuard, RolesGuard` | `admin, manager` |
| `ManufacturingController` | `JwtAuthGuard, RolesGuard` | `admin, manager, viewer` |
| → `POST production` (method-level) | overrides class | `admin, manager, worker` |
| → `POST production/range` (method-level) | overrides class | `admin, manager, worker` |

### 3. TypeCheck
`npx tsc --noEmit` — passed with zero errors.

### 4. Tests
`npm test` — 15 suites passed, 7 failed (all pre-existing dependency resolution issues in test setup — `AuthLoginService`, `MachineService`, `NotificationsService` missing from test modules — unrelated to these changes).

## Commit
```
e2dda0f feat(rbac): protect all endpoints with @Roles decorator
```

## Issues Encountered
- Currency and Documents controllers had no auth guard at all — added `JwtAuthGuard` plus `RolesGuard` and appropriate roles.
- Manufacturing controller has `@Public()` on export routes and `@Roles()` on production POST methods — these are method-level overrides that work correctly with NestJS's metadata reflection.
