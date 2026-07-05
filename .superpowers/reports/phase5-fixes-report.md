# Phase 5 Review Fixes

**Status:** ✅ Complete  
**Commit:** `f7113c4`  
**Date:** 2026-07-03  

## Fixes Applied

| # | Issue | File(s) | Change |
|---|---|---|---|
| 1 | Missing `DATABASE_TYPE` in CI env | `.github/workflows/ci.yml` | Added `DATABASE_TYPE: postgres` to both `test` and `e2e` job env blocks |
| 2 | Missing `DATABASE_SYNCHRONIZE` in CI test job | `.github/workflows/ci.yml` | Added `DATABASE_SYNCHRONIZE: 'true'` to `test` job env |
| 3 | `@Public()` on notifications endpoints bypasses auth | `backend/src/notifications/notifications.controller.ts` | Removed `@Public()` from `findAll()` and `getUnreadCount()` — class-level guards now apply |
| 4 | Missing role-based seed users | `backend/src/system/seed-data.ts` | Added manager/worker/viewer users after existing admin users |
| 5 | Frontend typecheck runs `next build` instead of `tsc` | `.github/workflows/ci.yml` | Changed to `npx tsc --noEmit` |
| 6 | CI e2e uses `sleep 5` instead of waiting for health | `.github/workflows/ci.yml` | Added `wait-on` install step and health-check wait step replacing `sleep 5` |
| 7 | CI only triggers on PR | `.github/workflows/ci.yml` | Added `push` trigger on all branches alongside existing PR trigger |

## Verification

- `npx tsc --noEmit` in backend: ✅ Passes (no errors)
- All changed files committed in `f7113c4`
