# Task 3 Fix Report: Rate Limiting

## What Was Fixed

### Issue 1: RateLimitGuard not registered in CommonModule
**File:** `backend/src/common/common.module.ts`

Added `RateLimitGuard` to both `providers` and `exports` arrays in `CommonModule`. This makes the guard available for DI across the application and allows other modules to import and use it directly.

### Issue 2: Test only asserted inheritance, not behavior
**File:** `backend/src/common/guards/rate-limit.guard.spec.ts`

Replaced the trivial `instanceof ThrottlerGuard` check with 4 meaningful tests:
- `should extend ThrottlerGuard` — structural assertion (kept from original)
- `should allow request within rate limit` — mocks storage returning `totalHits: 1` (under limit), verifies `canActivate` returns `true`
- `should throw ThrottlerException when rate limit exceeded` — mocks storage returning `isBlocked: true`, verifies `ThrottlerException` (HTTP 429) is thrown
- `should allow requests from different IPs independently` — verifies separate IPs get separate tracking

Key fix: Added `await guard.onModuleInit()` in `beforeEach` — the `ThrottlerGuard` sets `this.throttlers` in `onModuleInit()`, not the constructor, so calling `canActivate` without it caused `this.throttlers is not iterable`.

## Test Results

```
PASS src/common/guards/rate-limit.guard.spec.ts
  RateLimitGuard
    √ should extend ThrottlerGuard
    canActivate
      √ should allow request within rate limit
      √ should throw ThrottlerException when rate limit exceeded
      √ should allow requests from different IPs independently

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## Files Changed

| File | Change |
|---|---|
| `backend/src/common/common.module.ts` | Added `RateLimitGuard` to providers and exports |
| `backend/src/common/guards/rate-limit.guard.spec.ts` | Rewrote with 4 behavior-driven tests |

## Concerns

- None. The `ThrottlerGuard` v6 requires `onModuleInit()` to initialize `this.throttlers`. Tests must call it before exercising `canActivate`.
