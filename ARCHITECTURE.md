# 🏗️ توثيق القرارات المعمارية — ELMostafa (المصطفى)

> نظام إدارة مصنع بلاستيك متكامل (ERP)
> آخر تحديث: 2026-05-20

---

## 1. لماذا Next.js + NestJS بدلاً من Flutter + Supabase/Firebase؟

### المطلوب الأصلي (في البرومبت)
- Flutter (تطبيق جوال)
- Supabase أو Firebase (Backend-as-a-Service)

### القرار الفعلي
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Backend:** NestJS 11 + TypeORM + PostgreSQL

### الأسباب
1. **ERP ليس تطبيق جوال بحت** — إدارة المصنع تحتاج واجهة ويب متكاملة (شاشات كبيرة، تقارير، جداول، طباعة). الجوال يمكن إضافته لاحقاً كـ PWA.
2. **التحكم الكامل في البنية** — Supabase/Firebase تفرض قيوداً على الـ queries المعقدة، الـ transactions، والـ migrations. نظام ERP يحتاج تحكماً كاملاً في الـ SQL وعلاقات البيانات.
3. **الأداء في التقارير** — الـ aggregation queries المعقدة (تقارير الأرباح، تحليل المخزون، MRP) أسرع بكثير مع PostgreSQL المباشر.
4. **التكلفة طويلة المدى** — Firebase/Supabase تصبح باهظة مع حجم بيانات المصنع. PostgreSQL + NestJS على خادم واحد (أو VPS) أرخص بكثير.
5. **TypeScript في الطرفين** — مشاركة الأنواع (types) بين frontend و backend يقلل الأخطاء ويسرع التطوير.

---

## 2. Feature-based Architecture بدلاً من Clean Architecture

### Clean Architecture (الكلاسيكية)
```
data/
  entities/
  repositories/
domain/
  entities/
  use-cases/
presentation/
  pages/
  components/
```

### المستخدمة في المشروع
```
frontend/app/
  sales/
    orders/page.tsx
    customers/page.tsx
  inventory/
    products/page.tsx
    categories/page.tsx
  manufacturing/
    machines/page.tsx
    bom/page.tsx
    mrp/page.tsx
backend/src/
  sales/
    sales.controller.ts
    sales.service.ts
    sales.module.ts
    entities/
  manufacturing/
    manufacturing.controller.ts
    manufacturing.service.ts
    ...
```

### الأسباب
1. **سرعة التطوير** — فريق صغير (أو مطور واحد) يحتاج سرعة في الإنجاز. الـ feature-based architecture تقلل boilerplate.
2. **سهولة التنقل** — كل feature في مجلد واحد: الـ controller، service، entities، وكل ما يخصها.
3. **قابلية التوسع المعتدلة** — المشروع 18 موديول. الـ feature-based مناسب لهذا الحجم. لو وصل لـ 50+ موديول، يمكن إعادة الهيكلة لـ Clean Architecture عندها.
4. **الـ NestJS نفسه يشجع feature modules** — `@Module({ controllers, providers, imports })` يخدم هذا النمط مباشرة.

---

## 3. PostgreSQL + TypeORM بدلاً من MongoDB/Mongoose

### الأسباب
1. **العلاقات المعقدة** — نظام ERP يتطلب علاقات كثيرة: منتج ← فئة، أمر بيع ← عميل ← مدفوعات، BOM ← منتجات ← مكونات، إلخ.
2. **الـ transactions** — عمليات مثل إنشاء أمر بيع + خصم مخزون + ترحيل محاسبي تحتاج transactions. PostgreSQL + TypeORM تدعمها بشكل ممتاز.
3. **التقارير المالية** — الحسابات (debit/credit) والميزانيات تحتاج JOINs معقدة وaggregation. الـ RDBMS هو الخيار الطبيعي.
4. **المعرفة المتوفرة** — SQL مهارة منتشرة. MongoDB/Couchbase تحتاج خبرات نادرة في السوق المحلي.

---

## 4. نظام تسجيل الدخول (JWT + البريد الإلكتروني/الرقم الوظيفي)

### ما تم تنفيذه
- تسجيل الدخول بالبريد الإلكتروني **أو** الرقم الوظيفي + كلمة مرور
- JWT token في localStorage
- `usePermission` hook في الـ frontend للتحقق من الصلاحيات
- `@UseGuards(JwtAuthGuard)` في الـ backend

### لماذا ليس كما في البرومبت الأصلي؟
البرومبت طلب اسم/دور + dropdown + كلمة مرور. تم تغييره لأن:
- الرقم الوظيفي هو المعرف الفريد للعامل في المصنع (حتى لو تغير اسمه)
- البريد الإلكتروني اختياري لكنه مفيد للمديرين والمحاسبين
- الـ JWT يسمح بـ stateless authentication (مناسب للـ API)

---

## 5. أنماط معمارية مهمة مستخدمة

### 5.1 Dependency Injection (NestJS)
جميع الخدمات (services) والـ repositories يتم حقنها عبر constructor:
```typescript
constructor(
  @InjectRepository(Machine)
  private machineRepo: Repository<Machine>,
  private accountingService: AccountingService,
) {}
```

### 5.2 Repository Pattern (TypeORM)
كل entity لها repository خاص بها. الـ queries المعقدة تستخدم `QueryBuilder`:
```typescript
const qb = this.orderRepo
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.customer', 'customer')
  .skip((page - 1) * limit)
  .take(limit);
```

### 5.3 Transaction Pattern (معظم العمليات الحرجة)
استخدام `QueryRunner` للـ transactions التي تمتد على جداول متعددة:
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // عمليات متعددة
  await queryRunner.commitTransaction();
} catch {
  await queryRunner.rollbackTransaction();
}
```

### 5.4 Server-Side Pagination
جميع قوائم البيانات (أوامر بيع، منتجات، ماكينات) تستخدم server-side pagination مع `page`/`limit` query params لتجنب تحميل آلاف السجلات دفعة واحدة.

### 5.5 FetchWithAuth Pattern
الـ frontend يستخدم `api.fetchWithAuth()` الذي:
- يضيف Bearer token تلقائياً
- يضبط Content-Type
- يعيد التوجيه للـ /login عند 401
- يطبع Response JSON تلقائياً

### 5.6 Optimistic UI Updates
في بعض الصفحات (مثل الماكينات)، يتم تحديث الـ state محلياً بعد الحفظ بدلاً من إعادة تحميل القائمة بالكامل.

---

## 6. أنماط تصدير Excel المختلفة

يوجد 3 أنماط في المشروع:

| النمط | المكتبة | مكان الاستخدام |
|-------|---------|---------------|
| ExcelJS مع صور | ExcelJS | الأكسسوارات (تصدير مع الصور المضمنة) |
| XLSX (json_to_sheet) | xlsx (SheetJS) | المنتجات، الماكينات، القوالب، الخامات، المبيعات |
| Client-side XLSX | xlsx في المتصفح | صفحة التقارير (تحويل JSON إلى Excel مباشرة) |

تم توحيد جميع تصديرات الـ backend لاستخدام `XLSX.utils.json_to_sheet()` مع `XLSX.write()` لإنتاج XLSX ثنائي مع `Content-Type` صحيح.

---

## 7. الموديولات والتبعيات

```
SalesModule ──→ InventoryModule, AccountingModule
ManufacturingModule ──→ AccountingModule
PurchasesModule ──→ InventoryModule, AccountingModule
PayrollModule ──→ AccountingModule
```

تلاحظ: لا يوجد تكامل مباشر بين Sales و Manufacturing حاليًا. الربط فقط عبر Inventory (المنتجات/المخزون) والمحاسبة (قيد اليومية).

---

## 8. الأمان والصلاحيات

- JWT Guard على جميع الـ controllers (ما عدا `/auth/login`)
- `usePermission` hook يتحقق من صلاحية المستخدم لأداء إجراء معين
- Roles: Admin, Manager, Accountant, Storekeeper, Worker, User
- الصلاحيات مخزنة في قاعدة البيانات ويمكن تعديلها دون إعادة نشر

---

## 9. التوسع المستقبلي (مراحل مقترحة)

1. **Sales-Manufacturing Sync** — إنشاء ManufacturingOrder entity لربط أوامر البيع بالتصنيع
2. **WebSocket للإشعارات الفورية** — إشعارات عند اكتمال أمر إنتاج أو وصول مخزون للحد الأدنى
3. **تطبيق جوال (PWA)** — Next.js يدعم PWA بسهولة عبر next-pwa (مثبت حالياً)
4. **واجهة برمجة عامة (Public API)** — فتح endpoints محددة للشركاء والموردين
5. **الذكاء الاصطناعي** — التنبؤ بالطلب، تحسين جدولة الإنتاج
