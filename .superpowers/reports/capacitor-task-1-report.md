# Task 1: Static Export for Capacitor — Report

**Date:** 2026-07-04
**Branch:** master
**Commit:** 72d7e8c `feat(mobile): switch to static export for Capacitor`

---

## Objective
Switch the Next.js 16 frontend from SSR to static export (`output: 'export'`) so the build generates a self-contained `out/` directory that can be bundled into a Capacitor APK.

## Changes

### `frontend/next.config.ts`
- Set `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`
- Removed `@tailwindcss/postcss` from the experimental `turbopack.loaders` config (was listed twice, cleanup)

### 13 Dynamic Route Pages Split into Server + Client
All `[id]` / `[machineId]` pages were `'use client'` pages, which cannot export `generateStaticParams()`. Each was split:

| Directory | page.tsx (server) | client.tsx (new) |
|---|---|---|
| `inventory2/products/[id]` | `generateStaticParams` + import & render | Original `'use client'` component |
| `inventory2/products/[id]/movements` | same | same |
| `inventory2/semi-finished/[id]` | same | same |
| `inventory2/warehouses/[id]` | same | same |
| `manufacturing/kiosk/[machineId]` | same (also passes `machineId` prop) | Accepts `machineId` prop instead of `use(params)` |
| `manufacturing/machines/[id]` | same | same |
| `manufacturing/machines/[id]/maintenance` | same | same |
| `manufacturing/molds/[id]` | same | same |
| `manufacturing/raw-materials/[id]` | same | same |
| `manufacturing/raw-materials/[id]/add-stock` | same | same |
| `manufacturing/traceability/[id]` | same | same |
| `purchases/suppliers/statement/[id]` | same | same |
| `sales/customers/statement/[id]` | same | same |

**Key finding:** `generateStaticParams` must return non-empty arrays (`{ id: 'placeholder' }`) because Turbopack's route validation skips detection for pages whose parents have no generated routes.

### Other changes
- Modified `app/manufacturing/kiosk/[machineId]/client.tsx` to accept `machineId: string` prop instead of `use(params)`.

## Build Output
- 81 static pages generated (all `● SSG` for dynamic routes, `○ Static` for static routes)
- `ƒ Dynamic` routes: only `/api/chatbot/*` (expected — API routes cannot be static)
- `out/` directory generated successfully

## Tests
- `npx vitest run --reporter=verbose`: 3 test files, 14 tests — all passed

## Issues Encountered
1. **Next.js 16 with mandatory Turbopack**: No webpack fallback available
2. **`NEXT_DISABLE_TURBOPACK=1` has no effect** on Next.js 16
3. **Dynamic import / barrel re-export patterns** not detected by Turbopack's static analysis for `generateStaticParams`
4. **Empty `generateStaticParams` returns `[]`** caused Turbopack to skip validation for pages in nested dynamic segments
5. **`'use client'` + `generateStaticParams`** cannot coexist in the same file (Turbopack explicitly rejects)

## Next Steps
- Task 2: Capacitor init + build the APK from the `out/` directory
