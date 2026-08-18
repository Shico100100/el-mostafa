# 🔧 Refactor & Maintenance TODO — ELMostafa (المصطفى ERP)

> **آخر تحديث:** 2026-08-18 (بعد مراجعة عميقة + 4 commits: `a30eb06`, `1b5c50a`, `4084c01`, `b6a9de1`)
> **الحالة العامة:** المشروع **متين ومكتمل ومبنى صح** — القائمة دي "صيانة تدريجية" مش "إنقاذ".
> الأرقام أدناه حقيقية (محسوبة من على الأرض، مش تخمين).

---

## 📊 حجم المشروع (مرجع)
- **Backend:** 841 ملف TS، ~45K سطر، 36 موديول، 44 service، 23 entity
- **Frontend:** 442 ملف TS/TSX، ~37K سطر، 76 صفحة، 51 hook
- **الإجمالي:** ~83K سطر كود مصدري
- **Tests:** 35 backend spec + 9 frontend (بالإضافة لـ vitest files)

---

## 🎯 الأولويات (مرتبة)

### أولوية 1 — تقسيم الملفات الكبيرة (Code > 400 سطر)
دي 14 ملف كود فعلي (مش test) محتاجة تقسيم لتسهيل الصيانة.
الـ test files الطوال (spec/vitest) **مستبعدة عمداً** — طولها طبيعي.

| # | الملف | السطور | الاقتراح |
|---|-------|-------:|---------|
| 1 | `backend/src/system/seed-data.ts` | 1371 | استثناء: ده بيانات أولية مش منطق. يُفضّل تقسيمه لكل كيان (seed-products.ts, seed-customers.ts...) أو تركه. |
| 2 | `backend/src/peachtree-sync/peachtree-sync-invoice.service.ts` | 911 | مقسوم مؤخراً من الـ monolith — راجع إن لم يكن يحتاج subtasks أصغر (line-items vs header). |
| 3 | `backend/src/purchases/purchases.service.ts` | 775 | فصل الـ PO creation/update/return/price-history في sub-services. |
| 4 | `backend/src/manufacturing/manufacturing.controller.ts` | 749 | الـ controller ضخم جداً — انقل الـ logic للـ services وخلّي الـ controller thin. |
| 5 | `backend/src/manufacturing/raw-material.service.ts` | 678 | فصل الاستهلاك/الحركات/إعادة الحساب. |
| 6 | `backend/src/peachtree-sync/peachtree-sync.service.ts` | 642 | مقسوم مؤخراً — راجع. |
| 7 | `backend/src/inventory/inventory.service.ts` | 575 | فصل المنتجات/المخزون/الحركات. |
| 8 | `backend/src/sales/sales.service.ts` | 563 | فصل الطلبات/المرتجعات/المدفوعات. |
| 9 | `backend/src/peachtree-sync/peachtree-sync-debug.service.ts` | 537 | debug فقط — ممكن ينقل لمجلد `/debug` أو يُبقي كما هو. |
| 10 | `backend/src/manufacturing/manufacturing.service.ts` | 497 | فصل الإنتاج اليومي/الجدولة/الصيانة. |
| 11 | `backend/src/manufacturing/mold.service.ts` | 479 | فصل القوالب/مزامنتها/الإصدارات. |
| 12 | `backend/src/peachtree-sync/peachtree-sync-master.service.ts` | 444 | راجع بعد التقسيم. |
| 13 | `backend/src/reports/reports/analytics.service.ts` | 405 | فصل التقارير حسب النوع. |
| 14 | `backend/src/accounting/accounting.service.ts` | 404 | فصل اليومية/الأرصدة/المراكز. |

**نصيحة التنفيذ:** كل ملف لازم يتبع النمط الموجود (service صغير + controller thin). ابدأ بالأعلى تأثيراً: `manufacturing.controller.ts` و `purchases.service.ts`.

---

### أولوية 2 — تقليل استخدام `any` (240 استخدام)
مجموع `any` = **240**. معظمها في كود دفاعي/debug مش في الـ core business.

| الملف | العدد | ملاحظة |
|-------|------:|-------|
| `peachtree-sync/peachtree-sync-debug.service.ts` | 32 | debug — أقل أولوية |
| `peachtree-sync/peachtree-mapping.service.ts` | 17 | ممكن استبداله بـ DTO/interface |
| `peachtree-sync/peachtree-sync-invoice.service.ts` | 13 | راجع أنواع الفواتير |
| `hooks/purchases/usePurchaseOrderExcel.vitest.ts` | 13 | test — أقل أولوية |
| `notifications/notifications.service.spec.ts` | 11 | test — أقل أولوية |
| `manufacturing/warehouse.helper.ts` | 9 | استبدل بـ typed helper |
| `manufacturing/raw-material.service.ts` | 8 | راجع أنواع الحركات |
| `app/inventory2/products/page.tsx` | 8 | استبدل `as any` بـ interface للمنتج |
| `reports/reports.service.spec.ts` | 7 | test |
| `accounting/accounting.service.spec.ts` | 6 | test |
| `dashboard/dashboard.service.spec.ts` | 6 | test |
| `inventory/stock.service.spec.ts` | 6 | test |

**الأولوية العالية (core غير test):** `peachtree-mapping.service.ts` (17)، `warehouse.helper.ts` (9)، `raw-material.service.ts` (8)، `inventory2/products/page.tsx` (8).

**نصيحة:** لا تُصلح الـ `any` كلها دفعة واحدة — راجع الملفات اللي بتتعامل مع أنواع متغيرة (mapping/import/export) واعمللها DTOs صريحة.

---

### أولوية 3 — نقاط تحقق قبل النشر (Deployment Checks)
- [ ] **مزامنة الـ DB:** الـ migrations القديمة (1715...–1787...) اتعدّلت بـ `IF EXISTS` — آمنة على DB موجود أو جديد، بس تأكد إن الـ `migrations` table متزامن قبل أي `npm run migration:run` على production.
- [ ] **`.env` production:** راجع `backend/.env.production.example` — تأكد إن `JWT_SECRET` و `DB_PASSWORD` متغيرين (مش默认值).
- [ ] **Caddyfile / docker-compose.prod.yml:** اختبر المسار الكامل للنشر على الـ VPS قبل الإطلاق.
- [ ] **Backups:** مجلد `backups/` متجاهل في git (صح) — تأكد إن الـ cron job شغال وبياخد نسخة يومية.

---

### أولوية 4 — تحسينات مستقبلية (اختيارية)
- [ ] **Bundle analysis:** اتضاف `build:analyze` + `@next/bundle-analyzer` — شغّله وشوف أكبر chunks.
- [ ] **Tests coverage:** المشروع عنده tests بس مش معروف الـ coverage — شغّل `npm test -- --coverage` وحدد الفجوات (خاصة الـ accounting والمحاسبة).
- [ ] **WebSocket للإشعارات:** مذكور في ARCHITECTURE.md كمرحلة مستقبلية — الـ notifications gateway موجود، ممكن يُفعّل.
- [ ] **PWA:** `next-pwa` مثبّت — ممكن تفعيل وضع الأوفلاين للكشك (Kiosk).

---

## ✅ المنجز سابقاً (لا تكرار)
- [x] حذف `/inventory` القديم (dead code) + backup في `backups/manual_*`
- [x] توحيد BOM: `/manufacturing/boms` → redirect لـ `/bom`، الـ sidebar مظبوط
- [x] إصلاح `usePeachtreeSync` exhaustive-deps (كان ممكن يسبب loop)
- [x] حماية `system/reset` و `system/seed` بـ `{ confirm: true }`
- [x] تقسيم `peachtree-sync.service.ts` لـ 4 ملفات
- [x] `.gitignore` لـ `.pid`/`.bat`/caches
- [x] تحديث `mshro3.md` بـ banner + ملخص حقيقي

---

## 📌 ملاحظات
- **لا تبدأ features جديدة كبيرة** قبل ما تخلص أولوية 1 و 2 — الأساس لازم يفضل نضيف.
- أي تقسيم ملف = commit منفصل باسم واضح (conventional commits).
- راجع الملف ده كل شهر وحدّث الأرقام (شغّل الفحص اللي ولّده).
