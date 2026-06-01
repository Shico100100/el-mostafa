# Frontend lint fixes checklist

- Fix `frontend/next.config.ts` to remove `require()` import.
- Fix `frontend/lib/api.ts` all `any` types.
- Fix `frontend/lib/usePermission.ts` remove `any` and fix `setState` in effect.
- Fix `frontend/lib/sort-utils.ts` remove `any`.
- Fix `frontend/types/next-i18n.d.ts` remove `any`.
- Fix components/pages causing lint errors:
  - `frontend/components/NotificationCenter.tsx`
  - `frontend/app/production/page.tsx`
  - `frontend/app/manufacturing/daily-production/page.tsx`
  - (then continue iteratively until `npm run lint -- --max-warnings=0` is clean)

