# Task 3 Report: Update `lib/usePermission.ts`

**Status:** DONE

**Commit SHA:** `636b32f`

**Summary:**
- Added `VIEWER = 'Viewer'` to the `UserRole` enum
- Added `isViewer` and `isWorker` helper booleans (hierarchy: `isViewer` depends on `isStorekeeper`, `isWorker` depends on `isViewer`)
- Updated return object to include both new fields
- TypeScript compilation passed with zero errors

**Test Results:**
- `npx tsc --noEmit` — passed (no output / no errors)
