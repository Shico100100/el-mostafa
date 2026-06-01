# TODO - Fix frontend lint (npm run lint -- --max-warnings=0)

## 1) Fix lint-breaking issues in frontend
- Update `frontend/lib/api.ts` to remove `any` usage and type the JSON parsing/error payloads.
- Update `frontend/lib/usePermission.ts` to remove `any` and fix `setState` rule in effect.
- Update `frontend/lib/sort-utils.ts` to remove `any`.
- Update `frontend/next.config.ts` to remove `require()`-style import (use ESM import).
- Update `frontend/types/next-i18n.d.ts` to remove `any`.
- Update pages/components that lint-fail due to `any` / react/no-unescaped-entities / react-hooks warnings / react setState-in-effect.

## 2) Re-run lint until clean
- Run: `cd frontend && npm run lint -- --max-warnings=0`
- Iterate fixing remaining errors.

