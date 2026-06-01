# Checklist (A..E) — Verification for APP_PROMPT.md

> هذا الملف تم إنشاؤه لتجميع “Checklist” مطابق لمتطلبات `APP_PROMPT.md` وبناءً على تدقيق الكود (Backend Controllers + Frontend صفحات المطلوبة).

## A) نظرة عامة على التطبيق
- [ ] هدف التطبيق واضح في Docs (لم يتم العثور على صفحة/قسم مستقل يطابق بند الهدف كما هو في APP_PROMPT).
- [x] وجود تطبيق Full-stack (Next.js + NestJS + PostgreSQL) — مدعوم ببنية المشروع ووجود Controllers/Pages.

## B) صفحة Accessories (frontend/app/assembly/accessories/page.tsx)

### B1) الغرض من الصفحة
- [x] صفحة إدارة الأكسسوارات (UI + عمليات مخزون + تقارير + PO draft + Bulk stock + Excel import/export).

### B2) الغرض من الصفحة عبر backend endpoints (Verified)
انتهت بتطابق واضح مع Controllers داخل:
- `backend/src/manufacturing/accessories.controller.ts`

#### CRUD
- [x] GET `/manufacturing/accessories`
- [x] POST `/manufacturing/accessories` (مع upload `image`)
- [x] GET `/manufacturing/accessories/:id`
- [x] PUT `/manufacturing/accessories/:id` (مع upload `image`)
- [x] DELETE `/manufacturing/accessories/:id` (مع `reason`)

#### Stats
- [x] GET `/manufacturing/accessories/stats/total-value`

#### Reports / Draft / Bulk
- [x] GET `/manufacturing/accessories/reports/top-consumed`
- [x] GET `/manufacturing/accessories/reports/slow-moving`
- [x] GET `/manufacturing/accessories/po/draft`
- [x] POST `/manufacturing/accessories/stock/bulk`

#### Stock operations
- [x] POST `/manufacturing/accessories/:id/stock/add`
- [x] POST `/manufacturing/accessories/:id/stock/consume`

#### History
- [x] GET `/manufacturing/accessories/:id/history`

#### Excel
- [x] GET `/manufacturing/accessories/export/excel`
- [x] POST `/manufacturing/accessories/import/excel` (multipart file)

### B3) UX/Technical notes (Not evaluated fully)
- [ ] التأكد من تحويل KG↔Pieces end-to-end على مستوى backend (التحويل في frontend موجود، وتأكيد سياسة التحويل في backend غير موثق كبند منفصل).
- [ ] التأكد من أن قيم التكلفة (`last_purchase_price`/`cost_price`) مطابقة لسياسة محاسبية مطلوبة.

## C) صفحة Sales Orders (frontend/app/sales/orders/page.tsx)

### C1) الغرض من الصفحة
- [x] صفحة إدارة أوامر البيع: listing + filters + create order + details + payment + duplicate + export Excel.

### C2) backend endpoints (Verified جزئيًا)
انتهت بتطابق واضح مع:
- `backend/src/sales/sales.controller.ts`

#### Orders listing + pagination + filters
- [x] GET `/sales/orders`

#### Orders create/details/items
- [x] POST `/sales/orders`
- [x] GET `/sales/orders/:id`
- [x] GET `/sales/orders/:id/items`

#### Customers
- [x] GET `/sales/customers`
- [x] POST `/sales/customers`

#### Payments
- [x] POST `/sales/customers/:id/payments`
- [x] GET `/sales/customers/:id/payments`

### C3) UX/Technical notes (Not evaluated fully)
- [ ] endpoint/flow “Print” كـ backend requirement: UI يستخدم `react-to-print` بدون endpoint print صريح في controllers.
- [ ] تطابق Duplicate/Payment مع كل تفاصيل البرومبت (بشكل تفصيلي) يحتاج اختبارات e2e.

## D) مقارنة سريعة بين الصفحتين (Quick sync / Manufacturing integration)
- [x] تم بناء ManufacturingOrder entity + endpoints + تكامل مع MRP وواجهة إرسال للتصنيع في أوامر البيع.

## E) مخرجات توثيق مقترحة (Checklist)
- [x] تم إنشاء Checklist هنا لتغطية (A..E) بدل الاعتماد على وجود Checklist سابق.
- [x] تم إنشاء WALKTHROUGH.md مع شرح خطوة-بخطوة لكل صفحة ومراجع لـ 35 screenshot
- [x] تم إنشاء Cypress screenshot spec (`screenshots.spec.ts`) لالتقاط الصور تلقائياً
- [x] تم إضافة npm script `npm run screenshots`

---

## Testing Coverage Gap (Cypress)
- `cypress/e2e/inventory.spec.ts` الحالي لا يغطي Accessories/Sales Orders flows المطلوبة في البرومبت بشكل كاف.
- [x] إضافة Cypress specs لـ:
  - [x] Accessories: add/edit/delete, stock add/consume, history, reports, draft PO, bulk stock, export, delete
  - [x] Sales Orders: create order modal, duplicate, details, payment, filters/pagination, excel export, print smoke
  - [x] Manufacturing Orders: send to manufacturing, status display
- [x] تحديث الـ selectors لاستخدام `placeholder` و `title` بدلاً من `name` (لأن form fields في accessories تستخدم placeholder)
- [x] إضافة `cy.intercept()` لانتظار API calls وتقليل الـ flaky tests

