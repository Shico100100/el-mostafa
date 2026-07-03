# ToDo لتنفيذ تحسينات صفحة Machines — ✅ مُنجز بالكامل

> تم التحقق من الكود: جميع البنود التالية منفذة بالفعل في صفحة `frontend/app/manufacturing/machines/page.tsx`

## المرحلة 1: مراجعة وتحديث UI
- [x] إضافة validation basic قبل الإرسال (name/serial/power_consumption/status).
- [x] استبدال alert برسالة Toast/Inline (يستخدم `sonner` toast).

## المرحلة 2: تحسين بطاقة الماكينة
- [x] عرض `last_maintenance` و `next_maintenance` داخل البطاقة.
- [x] جعل تنبيه overdue actionable مع إشارة لونية (أحمر للـ overdue).

## المرحلة 3: تحسين منطق overdue
- [x] عرض "يستحق خلال X أيام" مع تلوين (أصفر ≤7 أيام، أحمر إذا تجاوز).

## المرحلة 4: تحسين الأداء
- [x] إضافة search + filter بالحالة + pagination.
- [x] تقليل reload كامل: استخدام React state محلي بدلاً من reload.

## المرحلة 5: تحسين Backend
- [ ] إضافة endpoint "overview" — اختياري، ليس ضرورياً حالياً.

---

## Build & Lint Status (2026-06-01)
- [x] Next.js upgraded 16.0.6 → 16.2.6 (latest stable)
- [x] Frontend ESLint: 0 errors, 0 warnings
- [x] Frontend `npm run build`: ✅ — 53 pages generated
- [x] Backend ESLint: no issues
- [x] Backend `npm run build`: ✅ via `nest build`
- [x] Backend tests: 11 suites, 25 tests — **all passing**
- [x] Fixed `RawMaterialRepository` missing provider in `purchases.service.spec.ts`
- [x] Fixed 4x S3 `credentials` — AWS SDK upgraded, `@ts-expect-error` removed, build clean
- [x] Backend `npm audit fix --force`: **55 → 3** vulns remaining (2 moderate, 1 high)
- [ ] Frontend `npm audit fix --force` would need to downgrade Next.js — skip

## Known Issues
- Backend: 3 unfixable vulns — `uuid` via `exceljs` (moderate), `xlsx` via SheetJS (high, no fix)
- Frontend: 8 unfixable vulns — `postcss` via Next.js, `serialize-javascript` via `next-pwa`, `xlsx` (no fix)
- Backend: `@nestjs/cli` pinned to 11.0.10 (reinstalled, `nest build` now works)
- AWS SDK upgraded 3.864.0 → 3.1057.0 — `credentials` typing fixed in newer version
