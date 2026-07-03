# Task 5 Fix Report — Swagger/OpenAPI Documentation

## What Was Fixed

### Critical Issue 1: Security Regression — JwtAuthGuard removed from Dashboard controller
- **File:** `backend/src/dashboard/dashboard.controller.ts`
- **Problem:** The `@UseGuards(JwtAuthGuard)` decorator and its import were removed, making the dashboard stats endpoint publicly accessible without authentication.
- **Fix:** Re-added `import { JwtAuthGuard } from '../auth/jwt-auth.guard';` and restored `@UseGuards(JwtAuthGuard)` on the controller class.

### Important Issue 2: @ApiOperation and @ApiResponse decorators missing on 4 controllers
- **Files:** `inventory.controller.ts`, `manufacturing.controller.ts`, `purchases.controller.ts`, `sales.controller.ts`
- **Problem:** These controllers imported `@ApiTags, @ApiOperation, @ApiResponse` from `@nestjs/swagger` but only applied `@ApiTags` at the class level. No endpoint-level documentation decorators were present.
- **Fix:** Added `@ApiOperation({ summary: '...' })` and `@ApiResponse({ status: ..., description: '...' })` to every route handler across all 4 controllers:
  - **Inventory:** 28 endpoints decorated (categories, products, warehouses, stock)
  - **Manufacturing:** 45+ endpoints decorated (machines, molds, BOMs, production, raw materials, fixed costs, assembly, maintenance, import/export)
  - **Purchases:** 30+ endpoints decorated (suppliers, orders, payments, currencies, FX rates, landed cost, containers, packing list, reorder)
  - **Sales:** 20+ endpoints decorated (customers, orders, quotes, returns, export)

### Important Issue 3: Unrelated changes in commit
- **Finding:** The `@Public()` decorator and `Public` import already existed in the inventory and manufacturing controllers before the Task 5 changes. These are pre-existing features (e.g., public Excel export endpoints) and do NOT represent unnecessary additions. No reverting needed.
- The `@Public()` decorator is used on specific export/stock endpoints that intentionally bypass auth — this is a design choice, not a regression.

## Test Results After Fix

- **TypeScript compilation (`npx tsc --noEmit`):** PASSED — zero errors
- All 5 controllers now have proper Swagger decorators
- JwtAuthGuard restored on Dashboard controller

## Files Changed

| File | Change |
|------|--------|
| `backend/src/dashboard/dashboard.controller.ts` | Restored `JwtAuthGuard` import and `@UseGuards()` |
| `backend/src/inventory/inventory.controller.ts` | Added `@ApiOperation` + `@ApiResponse` to all endpoints |
| `backend/src/manufacturing/manufacturing.controller.ts` | Added `@ApiOperation` + `@ApiResponse` to all endpoints |
| `backend/src/purchases/purchases.controller.ts` | Added `@ApiOperation` + `@ApiResponse` to all endpoints |
| `backend/src/sales/sales.controller.ts` | Added `@ApiOperation` + `@ApiResponse` to all endpoints |

## Concerns

- The `@Public()` decorators on certain export endpoints (inventory and manufacturing) bypass JWT authentication. This is intentional for public-facing export functionality but should be reviewed for security implications.
- The manufacturing controller has 650+ lines with 50+ endpoints — consider splitting into sub-controllers in future refactoring.
