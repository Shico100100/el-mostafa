# Task 4: ProtectedPage Component

**Status:** DONE
**Commit:** 2349ce34ac3b551448bb32e4ec046e016cfbd248

## Summary
Created `frontend/components/ProtectedPage.tsx` — a `'use client'` guard component that reads the current user's `roleId` via `usePermission()`, resolves allowed roles from the pathname using `resolveRoles()`, and redirects to `/dashboard` if unauthorized.

## Verification
- `npx tsc --noEmit` — passed with no errors
- File: `frontend/components/ProtectedPage.tsx` (24 lines)

## Changes
- `frontend/components/ProtectedPage.tsx` — new file
