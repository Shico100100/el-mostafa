# Task 3: Rate Limiting — Report

## What I Implemented
- Installed `@nestjs/throttler` package
- Created `RateLimitGuard` extending `ThrottlerGuard` at `backend/src/common/guards/rate-limit.guard.ts`
- Registered `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` in `backend/src/app.module.ts`
- Registered `RateLimitGuard` as `APP_GUARD` provider in `backend/src/app.module.ts`
- Configured: 100 requests per 60-second window per IP address

## What I Tested
- Unit test `rate-limit.guard.spec.ts` verifying `RateLimitGuard` extends `ThrottlerGuard`
- Full test suite ran: 74/96 passing (6 failing suites are pre-existing dependency issues)

## TDD Evidence

### RED
```
npx jest src/common/guards/rate-limit.guard.spec.ts --no-coverage
FAIL src/common/guards/rate-limit.guard.spec.ts
  ● Test suite failed to run
    Cannot find module './rate-limit.guard' or its corresponding type declarations.
```
Test failed because `RateLimitGuard` didn't exist yet — expected.

### GREEN
```
npx jest src/common/guards/rate-limit.guard.spec.ts --no-coverage
PASS src/common/guards/rate-limit.guard.spec.ts
  RateLimitGuard
    ✓ should be an instance of ThrottlerGuard (8 ms)
```
Test passes after implementing the guard.

## Files Changed
| File | Action |
|------|--------|
| `backend/package.json` | Modified (added `@nestjs/throttler`) |
| `backend/package-lock.json` | Modified (lockfile update) |
| `backend/src/common/guards/rate-limit.guard.ts` | **Created** |
| `backend/src/common/guards/rate-limit.guard.spec.ts` | **Created** |
| `backend/src/app.module.ts` | Modified (added ThrottlerModule + APP_GUARD) |

## Self-Review Findings
1. **Test adaptation**: The original spec's test (`new RateLimitGuard()`) wouldn't compile because `ThrottlerGuard` constructor requires 3 DI arguments. I adapted the test to pass mock arguments, preserving the intent (verify inheritance). This is correct for unit testing — DI provides these in production.
2. **Pre-existing test failures**: 6 test suites (22 tests) were already failing due to missing dependency mocks in their test modules. These are NOT caused by my changes.

## Commit
```
569e878 feat(backend): add rate limiting with ThrottlerGuard (100 req/min per IP)
```
