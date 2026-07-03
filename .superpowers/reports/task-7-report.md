# Task 7: Integration Tests - Auth Flow

## Status: DONE

## What Was Implemented

Created an in-process NestJS integration test for the authentication flow:

1. **`test/setup.ts`** — Shared test helper that:
   - Loads `.env` via dotenv before app bootstrap (required because `database.config.ts` validates `process.env` at import time)
   - Creates a NestJS test module with `AppModule`
   - Configures global prefix (`api`) and URI versioning (`v1`) to match `main.ts`
   - Applies `ValidationPipe` with whitelist/transform/forbidNonWhitelisted

2. **`test/auth.integration.spec.ts`** — Integration test that:
   - POSTs to `/api/v1/auth/email/login` with `admin@admin.com` / `admin123`
   - Asserts 200 status and `token` in response body
   - Uses the JWT token to GET `/api/v1/dashboard/stats`
   - Asserts 200 status and `totalSales` property in response

3. **`test/jest-integration.json`** — Jest config for integration tests matching `.integration.spec.ts` and `.e2e-spec.ts` patterns

## Test Results

```
PASS test/auth.integration.spec.ts (46.896 s)
  Auth Flow (Integration)
    √ should login and access protected route (1036 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## TDD Evidence

- **RED**: Initial run failed with `TS2349: This expression is not callable` — namespace import `import * as request from 'supertest'` not callable with supertest v7. Fixed by changing to default import `import request from 'supertest'`.
- **RED**: Second run failed with `EnvironmentVariablesValidator` errors — `.env` not loaded when running from `test/` directory. Fixed by adding `dotenv.config()` at top of `setup.ts`.
- **RED**: Third run failed with `404` on login route — global prefix and versioning not configured on test app. Fixed by adding `setGlobalPrefix()` and `enableVersioning()` to `setup.ts`.
- **GREEN**: Test passes with all assertions met.

## Files Changed

- `test/auth.integration.spec.ts` (new)
- `test/setup.ts` (new)
- `test/jest-integration.json` (new)

## Self-Review Findings

- **Supertest import**: The task spec used `import * as request from 'supertest'` which fails with supertest v7's TypeScript definitions. Changed to default import `import request from 'supertest'` — this is the correct pattern for supertest v7.
- **Setup.ts deviations from spec**: The spec mentioned `test/setup.ts` but didn't provide its code. I created it with dotenv loading and NestJS app configuration needed for the test to work.
- **Test dependencies**: `supertest` and `@types/supertest` were already installed in devDependencies — no `npm install` needed.
- **No overengineering**: Only created the 3 files specified; didn't add extra test suites or complex mocking.

## Commit

- `1129f43` — `test: add auth flow integration test (login → JWT → protected route)`

## How to Run

```bash
cd C:\ELMostafa\backend
npx jest --config test/jest-integration.json test/auth.integration.spec.ts --runInBand --forceExit
```
