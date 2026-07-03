# Task 8: Integration Tests - Inventory Flow

## What I Implemented

Created `backend/test/inventory.integration.spec.ts` with 3 integration tests:
1. **List products with pagination** — verifies paginated response (`data`, `total`, `page`)
2. **List categories** — verifies array response
3. **List warehouses** — verifies array response

## TDD Evidence

### RED
- Created test file with `res.body.items` assertion
- Test failed: `expect(received).toBeDefined()` — received `undefined`
- Root cause: products endpoint returns `{ data, total, page, limit, totalPages }` — not `{ items }`
- Fixed assertion to use `res.body.data`

### GREEN
- Changed `res.body.items` → `res.body.data`
- All 3 tests pass

## Test Results

```
PASS test/inventory.integration.spec.ts
  Inventory Flow (Integration)
    √ should list products with pagination (226 ms)
    √ should list categories (29 ms)
    √ should list warehouses (25 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

Full integration suite: 4/4 passing (auth + inventory).

## Files Changed
- `backend/test/inventory.integration.spec.ts` — NEW (50 lines)

## Self-Review
- Followed existing pattern from `auth.integration.spec.ts` (uses `createTestApp`/`closeTestApp` from `setup.ts`)
- Used `import request from 'supertest'` matching codebase convention
- Adapted spec to actual API response shape (`data` not `items`)
- No overbuilding, no unnecessary comments

## Notes
- Pre-existing e2e test failures (`TypeError: Invalid URL`) in `user/auth.e2e-spec.ts`, `admin/users.e2e-spec.ts`, `admin/auth.e2e-spec.ts` — not caused by this task
- Pre-existing eslint parsing error for test files — tsconfig only includes `src/**/*.ts`
