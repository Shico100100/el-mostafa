# Task 5 Report: Wire ProtectedPage into GlobalSidebar

**Status:** ✅ Complete

**Commit:** `57ec0e2` — "feat(rbac): wire sidebar filtering and page gating"

## Summary

Applied all 5 edits to `frontend/components/GlobalSidebar.tsx`:

1. **Imports added** — `useMemo`, `usePermission`, `resolveRoles`, `ProtectedPage`
2. **Role-based filtering** — `allowedModules` computed via `useMemo` + `resolveRoles`, placed before the login early return to satisfy Rules of Hooks
3. **Module map** — changed `modules.map` → `allowedModules.map`
4. **Children filter** — child items filtered by `resolveRoles` per child `href`
5. **Page gating** — `<main>` content wrapped in `<ProtectedPage>`

## Test Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Pass |
| `eslint --fix` (pre-commit hook) | ✅ Pass |
