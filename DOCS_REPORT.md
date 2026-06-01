# تقرير توثيق التطبيق

---

## (A) نظرة عامة على التطبيق

تطبيق **ELMostafa لإدارة المصنع** هو نظام متكامل لإدارة التصنيع والمخزون والمبيعات والمحاسبة. مبني بـ Next.js (واجهة أمامية) و NestJS (واجهة خلفية) مع PostgreSQL. يوفر لوحة تحكم مركزية لإدارة الماكينات، الإنتاج، المخزون، المشتريات، المبيعات، والموارد البشرية.

---

## (B) صفحة: إدارة الأكسسوارات (Accessories)

### 1. الغرض
عرض وإدارة الأكسسوارات (المواد المساعدة في التصنيع) مع عمليات المخزون (إضافة/صرف)، التقارير، مسودة طلبات الشراء، والاستلام المجمع.

### 2. هيكل الواجهة
- **الهيدر**: عنوان "إدارة الأكسسوارات" مع زر رجوع.
- **بطاقة الإحصائيات**: إجمالي قيمة المخزون (بالجنيه).
- **شريط الأزرار**: Excel (تصدير/استيراد)، التقارير، مسودة طلبية، استلام مجمع، إضافة أكسسوار.
- **جدول الأكسسوارات**: صورة، الاسم، الرصيد، الحالة (NORMAL/LOW_STOCK/OUT_OF_STOCK)، الوزن (جم)، حد الطلب، آخر سعر، المورد المفضل، إجراءات.
- **أزرار الإجراءات لكل صف**: ➕ إضافة رصيد، ➖ صرف، ✏️ تعديل، 📜 سجل الحركات، 🗑️ حذف.

### 3. البيانات
الأكسسوار مرتبط بـ `product` (له اسم ووحدة)، وله `current_stock`، `reorder_point`، `weight_per_piece`، `last_purchase_price`، `preferred_supplier`، `image_path` اختياري.

### 4. الـ Flows الأساسية

#### تحميل البيانات
- `GET /manufacturing/accessories` + `GET /manufacturing/accessories/stats/total-value` عند فتح الصفحة.
- يتم ترتيب البيانات أبجديًا باستخدام `sortAlphabetically`.

#### إضافة/تعديل أكسسوار
- مودال "إضافة جديد" / "تعديل" مع حقول: الاسم، صورة اختيارية (File input)، الوحدة، حد الطلب، وزن القطعة، ملاحظات.
- يتم الإرسال كـ `FormData` (لدعم رفع الصورة) عبر `POST /manufacturing/accessories` أو `PUT /manufacturing/accessories/:id`.

#### عمليات المخزون
- **إضافة رصيد (شراء)**: مودال مع اختيار الوحدة (بالعدد أو بالوزن KG) + كمية + سعر شراء اختياري + ملاحظات. `POST /manufacturing/accessories/:id/stock/add`.
- **صرف (استخدام)**: مودال مشابه مع تحويل KG إلى Pieces: `(KG * 1000) / weight_per_piece`. `POST /manufacturing/accessories/:id/stock/consume`.

#### سجل الحركات
- مودال يعرض جدول بالتاريخ والنوع (إضافة/صرف) والكمية والملاحظات. `GET /manufacturing/accessories/:id/history`.

#### حذف أكسسوار
- تأكيد عبر `confirm()` ثم `DELETE /manufacturing/accessories/:id`.

#### التقارير
- مودال "تقارير الأكسسوارات" مع تبويبين:
  - **الأكثر استهلاكاً**: `GET /manufacturing/accessories/reports/top-consumed?limit=10`
  - **المخزون الراكد**: `GET /manufacturing/accessories/reports/slow-moving?months=3`

#### مسودة أمر شراء
- مودال "طلب شراء نواقص (Draft PO)" مع جدول بالكمية المقترحة لكل صنف. يحتوي زر طباعة. `GET /manufacturing/accessories/po/draft`.

#### الاستلام المجمع
- مودال "استلام شحنة مجمعة" مع جدول ديناميكي (اختيار صنف + كمية + سعر) مع زر إضافة سطر. `POST /manufacturing/accessories/stock/bulk`.

#### Excel
- تصدير: `GET /manufacturing/accessories/export/excel`، استيراد: `POST /manufacturing/accessories/import/excel` (multipart) عبر `ExcelActions`.

### 5. التكامل مع API

| العملية | الطريقة | المسار |
|---------|---------|--------|
| تحميل الأكسسوارات | GET | `/manufacturing/accessories` |
| الإحصائيات | GET | `/manufacturing/accessories/stats/total-value` |
| إنشاء أكسسوار | POST | `/manufacturing/accessories` (FormData) |
| تحديث أكسسوار | PUT | `/manufacturing/accessories/:id` (FormData) |
| حذف أكسسوار | DELETE | `/manufacturing/accessories/:id` |
| إضافة رصيد | POST | `/manufacturing/accessories/:id/stock/add` |
| صرف | POST | `/manufacturing/accessories/:id/stock/consume` |
| سجل الحركات | GET | `/manufacturing/accessories/:id/history` |
| تقرير TOP | GET | `/manufacturing/accessories/reports/top-consumed` |
| تقرير SLOW | GET | `/manufacturing/accessories/reports/slow-moving` |
| مسودة أمر شراء | GET | `/manufacturing/accessories/po/draft` |
| استلام مجمع | POST | `/manufacturing/accessories/stock/bulk` |
| تصدير Excel | GET | `/manufacturing/accessories/export/excel` |
| استيراد Excel | POST | `/manufacturing/accessories/import/excel` (multipart) |

### 6. ملاحظات تقنية/UX
- **مودالز متعددة**: كل عملية لها مودال منفصل (إضافة، مخزون، سجل، تقارير، PO، استلام مجمع).
- **حالات التحميل**: عرض "جاري التحميل..." أثناء تحميل البيانات.
- **الصور**: عرض صورة الأكسسوار (إن وجدت) مع إمكانية التكبير عند الضغط.
- **تحويل KG→Pieces**: يتم في الواجهة (Client-side) وليس في الخادم.
- **ترجمة i18n**: يوجد `useTranslation` بسيطة تتعامل مع fallback (النص الأصلي في حال عدم وجود ترجمة).
- **التنبيهات**: استخدام `alert()` لتأكيد الحذف ونتائج العمليات.

---

## (C) صفحة: إدارة أوامر البيع (Sales Orders)

### 1. الغرض
عرض وإدارة أوامر البيع مع إمكانية التصفية، الترقيم، إنشاء أوامر جديدة، عرض التفاصيل، نسخ الأوامر، تسجيل الدفعات، الطباعة، وتصدير Excel.

### 2. هيكل الواجهة
- **الهيدر**: زر رجوع إلى لوحة التحكم + عنوان "إدارة أوامر البيع".
- **الأزرار**: "تصدير Excel" + "أمر بيع جديد".
- **فلتر البحث**: بحث بالعميل/الملاحظات + من تاريخ/إلى تاريخ + زر "إعادة ضبط".
- **جدول أوامر البيع**: التاريخ، العميل، المبلغ، الحالة (مكتمل/قيد الانتظار)، الإجراءات (عرض، نسخ، دفعة، طباعة).
- **شريط الترقيم**: عرض "X من Y أمر بيع" + زري السابق/التالي مع رقم الصفحة الحالي.

### 3. الـ Flows الأساسية

#### تحميل البيانات
- `GET /sales/orders?page=X&limit=Y&search=...&fromDate=...&toDate=...` مع `GET /sales/customers` و `GET /inventory/products` (بالتوازي).
- المنتجات تُصفى إلى `FINISHED` أو `SEMI` فقط.

#### إنشاء أمر بيع جديد
- مودال "إنشاء أمر بيع جديد" يحتوي:
  - **اختيار العميل**: `SearchableSelect` مع إمكانية إضافة عميل سريع.
  - **تاريخ الطلب**: input date.
  - **ملاحظات**: textarea.
  - **الأصناف المطلوبة**: جدول ديناميكي مع `SearchableSelect` للمنتج + كمية + سعر + إجمالي كل صنف + زر حذف صنف + زر إضافة صنف.
  - **حساب الإجمالي**: جمع إجمالي الأصناف مع خصم اختياري (نسبة/قيمة ثابتة).
- `POST /sales/orders` مع items.

#### إضافة عميل سريع
- مودال صغير: اسم + هاتف ثم `POST /sales/customers`. بعد الإضافة، يتم إعادة تحميل العملاء واختيار العميل الجديد تلقائيًا.

#### نسخ أمر بيع (Duplicate)
- جلب items الأمر: `GET /sales/orders/:id/items` ثم ملء مودال الإنشاء بنفس البيانات.

#### عرض التفاصيل
- مودال "تفاصيل أمر البيع" يحتوي: بيانات العميل، القيم المالية (الإجمالي)، جدول الأصناف، الملاحظات، مكون `AttachmentSection` للمرفقات.

#### تسجيل دفعة
- مودال "تسجيل دفعة نقدية": اسم العميل (للقراءة فقط)، قيمة الدفعة، تاريخ التحصيل، ملاحظات. `POST /sales/customers/:id/payments`.

#### طباعة الفاتورة
- استخدام `react-to-print` مع قالب طباعة مخفي (invoice template) يحتوي شعار الشركة، بيانات العميل، جدول الأصناف، وإجمالي الفاتورة.

#### تصدير Excel
- توليد ملف Excel client-side باستخدام `xlsx` (json_to_sheet) بأعمدة: رقم الأمر، التاريخ، العميل، المبلغ، الحالة، ملاحظات.

### 4. التكامل مع API

| العملية | الطريقة | المسار |
|---------|---------|--------|
| تحميل أوامر البيع | GET | `/sales/orders?page=&limit=&search=&fromDate=&toDate=` |
| تحميل العملاء | GET | `/sales/customers` |
| تحميل المنتجات | GET | `/inventory/products` |
| إنشاء عميل | POST | `/sales/customers` |
| إنشاء أمر بيع | POST | `/sales/orders` |
| جلب items أمر | GET | `/sales/orders/:id/items` |
| تسجيل دفعة | POST | `/sales/customers/:id/payments` |

### 5. ملاحظات تقنية/UX
- **مودالز متعددة**: 4 مودالز (إنشاء، تفاصيل، دفعة، عميل سريع).
- **حالات التحميل**: عرض "جاري التحميل..." أثناء التحميل و "لا توجد أوامر بيع حالياً" عند عدم وجود بيانات.
- **شفافية الأزرار**: أزرار الإجراءات تظهر فقط عند hover على الصف (opacity transition).
- **الطباعة**: تستخدم `react-to-print` مع قالب مخفي (`display: none`) يعمل كـ invoice.
- **التصدير**: يتم client-side باستخدام مكتبة `xlsx` (لا يحتاج endpoint خلفي).
- **الترقيم**: server-side pagination مع `page` و `limit` في الـ query string.
- **التنبيهات**: استخدام `alert()` لتأكيد نجاح/فشل العمليات.

---

## (D) مقارنة سريعة بين الصفحتين

| العنصر | الأكسسوارات | أوامر البيع |
|--------|-------------|-------------|
| نوع البيانات | مواد خام مساعدة (مخزون) | أوامر مبيعات (مالي) |
| العمليات الرئيسية | إضافة/صرف مخزون، تقارير، PO، استلام مجمع | إنشاء/نسخ، تسديد، طباعة، تصدير |
| عرض الصور | نعم (صورة الأكسسوار) | لا |
| تحويل وحدات | KG ↔ Pieces | لا |
| Pagination | لا (كل البيانات) | نعم (server-side) |
| Excel | تصدير + استيراد عبر API | تصدير client-side فقط |
| الطباعة | نعم (Draft PO فقط) | نعم (فاتورة كاملة) |
| i18n | نعم (useTranslation موجود) | لا |
| نوع النماذج | FormData (مع صورة) | JSON |
| الحوارات المتعددة | 6 (إضافة، مخزون×2، سجل، تقارير، PO، استلام) | 4 (إنشاء، تفاصيل، دفعة، عميل سريع) |

### القواسم المشتركة
- استخدام `sortAlphabetically` لترتيب البيانات.
- استخدام `alert()` للتنبيهات (نمط قديم).
- واجهة موحدة باللغة العربية (RTL).
- مودالز متعددة لكل عملية.
- نفس نظام الألوان (gradient from-slate-900).

---

## (E) مخرجات التوثيق

- [x] توثيق صفحات الأكسسوارات وأوامر البيع (هذا الملف).
- [x] توثيق حالات الأخطاء (Error Payloads) — انظر (F) أدناه.
- [x] إضافة قائمة بجميع الـ Modals واستخداماتها — انظر (G).
- [x] توثيق سياسة تحويل KG↔Pieces في المخزون — انظر (H).
- [x] توثيق تنسيق الفاتورة المطبوعة — انظر (I).
- [x] إضافة متطلبات Cypress tests — انظر (J).
- [x] توثيق i18n النمط المستخدم في الترجمة — انظر (K).

---

## (F) Error Payloads

### البنية العامة (TypeScript type)

```typescript
type ApiErrorPayload = {
    message?: string;    // رسالة الخطأ
    error?: unknown;     // تفاصيل إضافية (قد تكون string أو object)
    errors?: unknown;    // حقول validation (عند validation errors)
};
```

### أمثلة من الكود

| الحالة | مثال |
|--------|------|
| Validation error | `{ message: "Validation failed", errors: { name: "Name is required" } }` |
| Unauthorized | `{ message: "Unauthorized", error: "Invalid token" }` |
| Not found | `{ message: "Product not found" }` |
| Server error | `{ message: "Internal server error" }` |

### أماكن معالجتها
- **Frontend:** `api.ts` في دالة `fetchWithAuth` — يتم فحص `response.ok` وإلقاء خطأ إذا لم يكن OK.
- **Backend:** استثناءات NestJS عبر `HttpException` / `BadRequestException` / `NotFoundException` / `InternalServerErrorException`.

---

## (G) قائمة الـ Modals الأساسية

### في صفحة الأكسسوارات (Accessories):
| المودال | الوظيفة | Endpoint |
|---------|---------|----------|
| إضافة أكسسوار | إدخال اسم، صورة، وحدة، حد طلب، وزن قطعة، ملاحظات | POST /manufacturing/accessories |
| تعديل أكسسوار | تعديل بيانات أكسسوار موجود | PUT /manufacturing/accessories/:id |
| إضافة رصيد | إضافة مخزون (بالعدد أو KG) مع سعر شراء | POST /manufacturing/accessories/:id/stock/add |
| صرف مخزون | صرف مخزون (بالعدد أو KG) مع تحويل KG→Pieces | POST /manufacturing/accessories/:id/stock/consume |
| سجل الحركات | عرض جدول تاريخي لحركات المخزون | GET /manufacturing/accessories/:id/history |
| التقارير | تبويبان: الأكثر استهلاكاً + المخزون الراكد | GET /manufacturing/accessories/reports/* |
| مسودة أمر شراء | عرض كميات مقترحة مع طباعة | GET /manufacturing/accessories/po/draft |
| استلام مجمع | إدخال عدة أصناف مع كميات وأسعار | POST /manufacturing/accessories/stock/bulk |

### في صفحة أوامر البيع (Sales Orders):
| المودال | الوظيفة | Endpoint |
|---------|---------|----------|
| إنشاء أمر بيع | اختيار عميل، أصناف، كميات، خصم | POST /sales/orders |
| تفاصيل أمر بيع | عرض بيانات العميل، الأصناف، المرفقات | GET /sales/orders/:id |
| تسجيل دفعة | إدخال قيمة دفعة، تاريخ، ملاحظات | POST /sales/customers/:id/payments |
| إضافة عميل سريع | إدخال اسم وهاتف عميل جديد | POST /sales/customers |
| نسخ أمر بيع | تعبئة مودال الإنشاء من أمر موجود | GET /sales/orders/:id/items |

### في صفحات أخرى:
| المودال | الصفحة | الوظيفة |
|---------|--------|---------|
| فحص جودة جديد | QC | إنشاء فحص جودة (PASS/FAIL) مع select لسجل الإنتاج |
| تعديل سعر سريع | المنتجات | تعديل سعر البيع والكمية inline في الجدول |

---

## (H) سياسة تحويل KG ↔ Pieces

### أين يتم التحويل؟
يتم التحويل **في الواجهة الأمامية (Client-side)** حصراً — في صفحة `accessories/page.tsx` عند عمليات صرف المخزون.

### كيفية التحويل
```
Pieces = (KG * 1000) / weight_per_piece
```
- المدخل: المستخدم يدخل الوزن بـ KG
- المخرج: عدد القطع المحسوب
- التقريب: `Math.round()` لأقرب عدد صحيح

### مثال
```
weight_per_piece = 50g
المستخدم يدخل: 2 KG
الناتج: (2 * 1000) / 50 = 40 قطعة
```

### إيضاحات
- الـ Backend يستقبل `quantity` كرقم صحيح (بعد التحويل) ولا يقوم بالتحويل بنفسه.
- العمليات: `addStock` و `consumeStock` في `accessories.service.ts` تتعامل مع `quantity` مباشرة.
- السياسة الحالية لا تستخدم Weighted Average — `last_purchase_price` يتم تحديثه إلى آخر سعر تم إدخاله.

---

## (I) تنسيق الفاتورة المطبوعة (Invoice)

### آلية الطباعة
- استخدام مكتبة `react-to-print` مع قالب HTML مخفي (`display: none`).
- القالب موجود داخل `frontend/app/sales/orders/page.tsx` في المتغير `printContent`.

### عناصر الفاتورة
```
┌─────────────────────────────────────────┐
│           [شعار الشركة]                   │
│           فاتورة مبيعات                   │
│                                          │
│  العميل: [اسم العميل]                    │
│  التاريخ: [تاريخ الأمر]                   │
├─────────────────────────────────────────┤
│  #  | المنتج     | الكمية | السعر | الإجمالي │
│  1  | [منتج]     | [X]    | [Y]  | [Z]   │
│  2  | [منتج]     | [X]    | [Y]  | [Z]   │
├─────────────────────────────────────────┤
│  الخصم: [قيمة الخصم]                     │
│  الإجمالي: [المبلغ النهائي] ج.م         │
├─────────────────────────────────────────┤
│  [ملاحظات الفاتورة]                      │
└─────────────────────────────────────────┘
```

### خصائص الطباعة
- نمط الطباعة: `@media print` مع إخفاء العناصر غير المرغوب فيها.
- يتم إنشاء `Blob` للطباعة عبر `react-to-print` بدون endpoint خلفي.

---

## (J) متطلبات اختبارات Cypress

### الملفات الموجودة
| الملف | يغطي |
|-------|------|
| `cypress/e2e/accessories.spec.ts` | إضافة/تعديل/حذف أكسسوار، إضافة/صرف مخزون، سجل، تقارير، Draft PO، Bulk Stock، تصدير Excel |
| `cypress/e2e/sales-orders.spec.ts` | إنشاء أمر بيع، نسخ، تفاصيل، دفعة، تصفية، ترقيم، تصدير Excel، طباعة |
| `cypress/e2e/manufacturing-orders.spec.ts` | إرسال للتصنيع، عرض حالة التصنيع |
| `cypress/e2e/screenshots.spec.ts` | التقاط صور لجميع الصفحات تلقائياً |

### كيفية التشغيل
```bash
cd frontend
npx cypress run                          # تشغيل كل الاختبارات
npm run cypress:open                      # فتح واجهة Cypress التفاعلية
npm run screenshots                       # التقاط صور للصفحات فقط
```

### Selectors المستخدمة
- `placeholder` بدلاً من `name` في form fields (لأن form fields تستخدم placeholder).
- `title` للأزرار (مثل زر الحذف).
- `cy.intercept()` لانتظار API calls وتقليل Flaky tests.

---

## (K) نمط i18n المستخدم في الترجمة

### أين يستخدم؟
فقط في صفحة الأكسسوارات (`accessories/page.tsx`).

### كيف يعمل؟
```typescript
const useTranslation = () => ({
    t: (key: string) => {
        const dict: Record<string, string> = {
            // ترجمات عربية
        };
        return dict[key] || key;  // fallback إلى المفتاح الأصلي
    }
});
```

### خصائص النمط
- **Fallback بسيط:** إذا لم توجد ترجمة، يُرجع المفتاح الأصلي (key).
- **لا يستخدم مكتبة خارجية:** يعتمد على دالة JavaScript بسيطة داخل المكون.
- **قاموس محدود:** يحتوي فقط على الترجمات المستخدمة في الصفحة.
- **لا يدعم التبديل الديناميكي** بين اللغات (يحتاج reload للتحديث).

### إشارة للمستقبل
- إذا أردت إضافة ترجمة كاملة، يفضل استخدام `next-i18n` أو `react-i18next` مع ملفات JSON لكل لغة.
- النمط الحالي مناسب للتطبيقات الصغيرة أو عند الحاجة لترجمة سريعة دون تعقيد.
