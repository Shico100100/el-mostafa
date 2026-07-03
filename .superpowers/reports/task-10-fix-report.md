# Task 10: E2E Tests Fix Report

## What Was Fixed

### Fix 1: Navigation test — click parent then child (dashboard.spec.ts)
- **Problem:** The test clicked `text=المخزون` which hits a button that only calls `toggleSection()` to expand — no navigation occurs
- **Fix:** Two clicks: `button:has-text("المخزون")` expands the section, then `button:has-text("لوحة المخزون")` clicks the child link that calls `router.push('/inventory2')`

### Fix 2: Error test — corrected assertion string (login.spec.ts)
- **Problem:** Test asserted `text=خطأ` but the login page sets error as `'كلمة المرور غير صحيحة'`
- **Fix:** Changed assertion to `text=كلمة المرور غير صحيحة` matching the actual error message

## Files Changed
- `frontend/e2e/dashboard.spec.ts` — 2 lines changed (+2)
- `frontend/e2e/login.spec.ts` — 1 line changed (+1, -1)

## Concerns
None. Both fixes are minimal, targeted, and verified against the actual component behavior (`GlobalSidebar.tsx` renders children as `<button>` elements that call `router.push()`, and the login page uses `'كلمة المرور غير صحيحة'` as the error string).
