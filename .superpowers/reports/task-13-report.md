# Task 13: Sentry Error Tracking

## Status: ✅ Complete

## Commits
- `4a80096` - feat: add Sentry error tracking

## Files Changed
| File | Action |
|------|--------|
| `backend/src/sentry/sentry.module.ts` | Created |
| `backend/src/sentry/sentry.interceptor.ts` | Created |
| `backend/src/sentry/sentry.interceptor.spec.ts` | Created |
| `backend/src/main.ts` | Modified — added Sentry.init() |
| `backend/src/app.module.ts` | Modified — added SentryModule and SentryInterceptor as APP_INTERCEPTOR |
| `backend/.env` | Modified — added SENTRY_DSN (gitignored) |
| `backend/package.json` | Modified — added @sentry/nestjs, @sentry/profiling-node |
| `backend/package-lock.json` | Modified — lockfile update |

## Test Summary
```
PASS src/sentry/sentry.interceptor.spec.ts (32.667 s)
  SentryInterceptor
    √ should be defined (6 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## Notes
- `.env` is gitignored; SENTRY_DSN must be configured manually in production
- SentryInterceptor is registered before AuditInterceptor in the APP_INTERCEPTOR providers array so errors are captured before audit logging
