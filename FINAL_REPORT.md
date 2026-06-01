# تقرير نهائي (نقد + اقتراحات إصلاح) — بناءً على APP_PROMPT و تدقيق الكود

مرجع أساسي: `CHECKLIST.md`

---

## 1) هل تم تنفيذ كل نقاط المشروع؟ (A..E)

### ملخص تنفيذي
- **B (Accessories):** تنفيذ قوي وموجود بأدلة endpoints في `backend/src/manufacturing/accessories.controller.ts` + توافق واضح مع `frontend/app/assembly/accessories/page.tsx`.
- **C (Sales Orders):** تنفيذ واجهة/تدفق البيع وأوامر البيع موجود بأدلة endpoints في `backend/src/sales/sales.controller.ts` + توافق مع `frontend/app/sales/orders/page.tsx`.
- **D (Quick sync بين التصنيع والمبيعات):** **غير مثبت** بشكل كافٍ بأدلة endpoints/flows صريحة.
- **E (Checklist وثائقي للتوثيق):** تم إنشاء `CHECKLIST.md` الآن كوثيقة تحقق، لكن **لم تكن موجودة مسبقًا كوثيقة رسمية داخل المشروع**.

بالتالي: **المشروع لا يعتبر “منفذ بالكامل لكل نقاط APP_PROMPT”** بسبب (D) غير مثبت و (E) كان ناقصًا كتوثيق Checklist سابق.

---

## 2) تقرير انتقادي (Critique)

### 2.1 مشاكل جاهزية الإنتاج (Production Readiness)
1) **Hardcoded URL للصور في Accessories**
- في `frontend/app/assembly/accessories/page.tsx` يتم استخدام:
  - `http://localhost:3001${acc.image_path}`
- المشكلة: أي تشغيل على بيئة مختلفة (IP/Port/Reverse proxy) سيؤدي لعدم عرض الصور.

### 2.2 i18n قد يسبب تعارضات منطقية مع البيانات
- الصفحة تقوم بعمل i18n عبر تعديل `product.name` داخل الـ state.
- المشكلة: إذا كان `product.name` يستخدم كهوية للبحث/Upsert/مراجع داخل backend، فهذا قد يؤدي لعدم تطابق البيانات بين UI و backend.

### 2.3 تحويل KG ↔ Pieces غير موثق كسياسة end-to-end
- frontend ينفذ تحويل مع rounding (`Math.round`).
- backend accessories stock ops ظاهر أنها تستقبل `quantity` رقمية مباشرة بدون “تحويل KG↔Pieces” منطقيًا.
- النتيجة: اختلاف محتمل بين سياسة التحويل في الواجهة وسياسة المحاسبة/المخزون في backend.

### 2.4 محاسبة التكلفة/قيمة المخزون ليست سياسة واضحة
- `AccessoriesService.addStock()` يحدّث `cost_price` إلى “آخر سعر” وليس Weighted Average أو سياسة واضحة.
- كما أن قيمة المخزون (stats) تعتمد على `last_purchase_price`.
- بدون توثيق وسياسة محاسبية، قد يختلف متوقع المستخدم عن فعلي النظام.

### 2.5 Excel import/export معقد وقابل للكسر
- export يتضمن صور داخل Excel.
- import يحاول استخراج الصور عبر عناصر داخلية في ExcelJS (`workbook.model.media`).
- هذا عالي الهشاشة عبر نسخ ExcelJS/اختلافات Excel.
- لا توجد طبقة ضمان/validation ظاهرة لملفات Excel الداخلة.

### 2.6 الاختبارات (Cypress) غير كافية لمساحة المطلوب
- `cypress/e2e/inventory.spec.ts` يغطي /inventory بشكل محدود.
- لا يغطي مسارات Accessories/Sales Orders المذكورة في البرومبت (reports, PO draft, bulk stock, history, duplicate/payment/filters/excel/print flows).

---

## 3) اقتراحات إصلاح مرتبة حسب الأولوية

### Priority P0 (إصلاحات تؤثر مباشرة على التشغيل/صحة البيانات)
1) إزالة hardcoded `localhost` في `AccessoriesPage`:
- استخدم base url من env/config (مثل `NEXT_PUBLIC_API_BASE_URL`) أو relative URLs.

2) فصل i18n presentation عن data identity:
- لا تعدل `product.name` كقيمة data.
- استخدم `displayName` أو طبقة ترجمة display-only.

3) توحيد تحويل KG↔Pieces:
- إمّا تنفيذ التحويل في backend مع policy rounding واضحة.
- أو إرسال payload يحدد الوحدة (KG/Pieces) والbackend يحسب.

### Priority P1 (تصحيح صحة العمليات والمخرجات)
4) تحديد سياسة تكلفة المخزون:
- Weighted Average أو Last Cost (حسب المطلوب) ووثّقها.
- اعكس نفس السياسة في stats و report.

5) تقوية Excel import/export:
- تقليل reliance على embedded image extraction.
- أو إضافة validation + fallback عند فشل الصور.

### Priority P2 (تحسين الجودة والوثائق والاعتمادية)
6) توسيع Cypress:
- إنشاء spec مستقل لـ Accessories و Sales Orders.
- تغطية: add/edit/delete, stock add/consume, history, reports, draft PO, bulk stock, export/import.
- تغطية Sales Orders: create order, items, duplicate, payment submit, filters/pagination, print smoke, excel export.

7) توثيق Checklist (E) واعتباره Contract:
- اجعل `CHECKLIST.md` جزءًا من مراجعة PR.
- أضف links لسكرين شوت/ملفات اختبار.

---

## 4) إشارة مرجعية
- Checklist: `CHECKLIST.md`

---

## خاتمة
المنظومة تمتلك أساس وظيفي قوي في Accessories/Sales Orders (Endpoints/Services موجودة بوضوح). لكن اكتمال “البرومبت” كمعيار تسليم يحتاج:
- إصلاح جاهزية الإنتاج (hardcoded URLs)
- توحيد سياسات التحويل (KG↔Pieces)
- تقوية الاختبارات
- وتوثيق Checklist القابل للتدقيق كـ (E)

