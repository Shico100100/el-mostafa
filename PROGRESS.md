# 📊 سجل تقدم المشروع — ELMostafa (المصطفى)

> نظام إدارة مصنع بلاستيك (Next.js + NestJS + PostgreSQL)
> تاريخ البدء: [غير محدد] | تاريخ آخر تحديث: 2026-05-20

---

## 🏗️ المرحلة 1: الأساسيات (Infrastructure & Auth)
- [x] تهيئة مشروع Next.js 16 (App Router)
- [x] تهيئة مشروع NestJS 11 + PostgreSQL (TypeORM)
- [x] نظام المصادقة (تسجيل دخول بالبريد الإلكتروني/الرقم الوظيفي + JWT)
- [x] إدارة المستخدمين والأدوار (Admin, Manager, Accountant, Storekeeper, Worker, User)
- [x] الصلاحيات الديناميكية بناءً على الدور (usePermission hook)
- [x] نظام التدقيق (Audit Log)
- [x] الإشعارات (Notifications)
- [x] دعم i18n (الترجمة)

## 🏗️ المرحلة 2: إدارة المخزون (Inventory)
- [x] إدارة المنتجات (CRUD + تصفية + ترقيم صفحات)
- [x] إدارة الفئات (Categories)
- [x] حركات المخزون (دخول/خروج)
- [x] استيراد/تصدير Excel مع الصور
- [x] تعديل مباشر في الجدول (Inline Edit)

## 🏗️ المرحلة 3: المبيعات (Sales)
- [x] إدارة العملاء (CRUD)
- [x] أوامر البيع (إنشاء + عرض + تصفية + ترحيل)
- [x] تسجيل المدفوعات
- [x] طباعة الفاتورة + PDF
- [x] تصدير Excel
- [x] نسخ أمر بيع (Duplicate)
- [x] مرتجعات المبيعات

## 🏗️ المرحلة 4: المشتريات (Purchases)
- [x] إدارة الموردين (CRUD)
- [x] أوامر الشراء (إنشاء + عرض)
- [x] تسجيل مدفوعات الموردين
- [x] مرتجعات المشتريات

## 🏗️ المرحلة 5: التصنيع (Manufacturing)
- [x] الماكينات (Machines CRUD + حالة التشغيل)
- [x] القوالب (Molds CRUD + مزامنة)
- [x] الإنتاج اليومي (Daily Production CRUD)
- [x] الخامات (Raw Materials CRUD + حركات + إعادة حساب)
- [x] التكاليف الثابتة (Fixed Costs)
- [x] الصيانة (Maintenance)
- [x] مراقبة الجودة (QC Inspections)
- [x] المواعيد والحضور (Attendance)
- [x] **قائمة المكونات BOM** — ✅ مكتمل (تفجير ديناميكي + CRUD + PDF + صفحة BOM التجميع)
- [x] **التجميع (Assembly)** — ✅ مكتمل (لوحة تحكم + Plastic + Packaging + أكسسوارات)
- [x] **التخطيط (Planning/Scheduling)** — ✅ مكتمل (جداول إنتاج + ملخص)
- [x] **MRP** — ✅ مكتمل (صفحة تخطيط احتياجات + ربط بأوامر التصنيع)
- [x] **التتبع (Traceability)** — ✅ مكتمل (ProductionBatch + BatchComponent entities، تتبع أمامي/عكسي، صفحات دفعات وتفاصيل)
- [x] **الكشك (Kiosk)** — ✅ مكتمل (واجهة تشغيل + أزرار تنبيه مرتبطة بالصيانة)

## 🏗️ المرحلة 6: التجميع (Assembly)
- [x] إدارة الأكسسوارات (CRUD + صور + عمليات مخزون + تقارير)
- [x] مسودة طلب شراء (Draft PO)
- [x] الاستلام المجمع (Bulk Stock)
- [x] استيراد/تصدير Excel
- [x] البلاستيك (Plastic) — ✅ مكتمل
- [x] التعبئة (Packaging) — ✅ مكتمل
- [x] الإنتاج (Production) — ✅ مكتمل (صفحة تسجيل إنتاج + عرض تاريخ العمليات)
- [x] قائمة المكونات (BOM) — ✅ مكتمل (تفجير ديناميكي + صفحة BOM التجميع)

## 🏗️ المرحلة 7: المحاسبة (Accounting)
- [x] شجرة الحسابات (Chart of Accounts)
- [x] قيود اليومية (Journal Entries)
- [x] ميزان المراجعة (Trial Balance)

## 🏗️ المرحلة 8: الموارد البشرية (HR)
- [x] إدارة الموظفين
- [x] المرتبات (Payroll Calculation + Payments)

## 🏗️ المرحلة 9: التقارير (Reports)
- [x] تقارير المبيعات
- [x] تقارير الأرباح/الخسائر
- [x] تقارير المخزون
- [x] الاتجاهات (Trends)

## 🏗️ المرحلة 10: لوحة التحكم (Dashboard)
- [x] إحصائيات عامة (KPIs)
- [x] برج التحكم (Control Tower)
- [x] رسوم بيانية (Charts with Recharts)

---

## 🔮 المراحل القادمة (Upcoming Phases)

### المرحلة 11: تفجير BOM الديناميكي (Dynamic BOM Explosion) ✅
- [x] إضافة حقول الوزن والصورة ونوع الخامة إلى Product entity
- [x] إضافة endpoint للتفجير التكراري (`GET boms/:id/explode?quantity=`)
- [x] إنشاء صفحة إدارة BOM كاملة (قائمة، إنشاء، تعديل)
- [x] واجهة تفجير BOM مع عرض جميع المكونات والأوزان والمواصفات والصور
- [x] توليد PDF تقرير للمورد (اسم المكون - مواصفات - كمية - وزن)

### المرحلة 12: العملات المتعددة وحساب التكلفة الكلية (Multi-Currency & Landed Cost) ✅
- [x] إنشاء entities العملات (Currency, FxRate) مع سعر الصرف مقابل EGP
- [x] إضافة حقول العملة وسعر الصرف إلى Purchase Order
- [x] إضافة حقول التكلفة الكلية (freight, customs, commission, weight) إلى Purchase Order
- [x] إضافة حقل landed_cost لكل item في أمر الشراء
- [x] خوارزمية حساب التكلفة الكلية (Landed Cost Matrix):
  - [x] التكلفة الأساسية = سعر الوحدة × سعر الصرف
  - [x] عمولة المكتب = التكلفة الأساسية × نسبة العمولة
  - [x] الجمارك = التكلفة الأساسية × نسبة الجمارك
  - [x] الشحن = (إجمالي الشحن ÷ إجمالي وزن الشحنة) × وزن الوحدة
  - [x] إجمالي التكلفة الكلية = مجموع ما سبق
- [x] حساب سعر الصرف المرجح (Weighted Average FX) للدفعات المقسمة
- [x] صفحة إدارة العملات وأسعار الصرف
- [x] نافذة حساب التكلفة الكلية في صفحة أوامر الشراء

### المرحلة 13: تحسين الحاويات والوزن (Container & Weight Optimization) ✅
- [x] إنشاء entity الحاويات (الأبعاد، السعة CBM، الوزن الأقصى)
- [x] حساب حجم الشحنة بـ CBM (الطول × العرض × الارتفاع × عدد الكراتين)
- [x] مقارنة الحجم مقابل الحاويات القياسية (20 قدم / 40 قدم) مع نسبة الاستخدام
- [x] إنشاء entity قائمة التعبئة (Packing List) مرتبطة بأمر الشراء
- [x] التمييز بين الوزن الصافي (Net Weight) والوزن الإجمالي (Gross Weight)
- [x] قائمة التعبئة (Packing List Validation):
  - [x] إدخال الوزن الفعلي وعدد الكراتين التي شحنها المورد
  - [x] تنبيه تلقائي عند انحراف القيم عن الحدود المسموحة
  - [x] تحليل الحاويات المناسبة مع المساحة المتبقية
- [x] صفحة إدارة الحاويات + حاسبة CBM
- [x] نافذة قائمة التعبئة في صفحة أوامر الشراء مع تحليل الانحراف

### المرحلة 14: المخزون الذكي وربحية الشحنات (Smart Inventory & Profitability) ✅
- [x] اقتراحات إعادة الطلب الذكية (استغلال المساحة المتبقية في الحاوية للمنتجات منخفضة المخزون)
- [x] تقرير ربحية الشحنات لكل أمر شراء (الإيرادات - COGS - التكلفة الإضافية - هامش الربح)
- [x] تحليل أعلى 5 منتجات هامش ربح
- [x] تفاصيل الأصناف لكل شحنة (مشترى/مباع/تكلفة/ربح)
- [x] واجهة اقتراحات إعادة الطلب في صفحة الحاويات
- [x] تبويب ربحية الشحنات في صفحة التقارير مع تصدير Excel

### المرحلة 15: Fix Placeholders & تحسينات 🔴
- [x] بناء صفحة Assembly الرئيسية (لوحة تحكم التجميع)
- [x] بناء صفحة MRP (تخطيط الاحتياجات مع بيانات حقيقية من الـ API)
- [x] بناء صفحة تخطيط الإنتاج (جداول الإنتاج مع ملخص)
- [x] بناء صفحة مراقبة الجودة (QC Dashboard مع نسبة التلف)
- [x] بناء صفحة BOM التجميع (عرض قوائم المكونات)
- [x] بناء صفحة بلاستيك (عرض المنتجات البلاستيكية)
- [x] بناء صفحة التعبئة والتغليف (بطاقات أقسام)
- [x] تحديث صفحة "قيد التطوير" إلى "روابط سريعة" للصفحات الجاهزة
- [x] إصلاح hardcoded `localhost` في صفحة الأكسسوارات (لم يوجد hardcoded localhost في الصفحات)
- [x] توحيد سياسة تحويل KG↔Pieces (إضافة التحويل إلى الـ backend في addStock/consumeStock)
- [x] تقوية Excel import/export (إصلاح تصدير Machines/Molds/RawMaterials من JSON إلى XLSX، إضافة تصدير Excel للمبيعات والعملاء)
- [x] إصلاح تضارب مسار MRP (نقل endpoints `planning` و `adhoc` إلى MRPController وحذف النسخ المكررة من ManufacturingController)
- [x] ربط أزرار التنبيه في الكشك (Kiosk) بـ API الصيانة
- [x] تحديث api.getProducts() لدعم معامل `type`
- [x] تحسين صفحة التعبئة والتغليف (Packaging) لعرض بيانات حقيقية مع تصفية

### المرحلة 16: التوثيق الكامل (Documentation) 📝
- [x] إنشاء README.md لكل feature folder (بالعربية)
- [x] توثيق القرارات التقنية والأسباب لكل خيار معماري (ARCHITECTURE.md)

### المرحلة 17: التكامل بين المبيعات والتصنيع 🆕
- [x] إنشاء entity ManufacturingOrder (يربط أوامر البيع بأوامر التصنيع)
- [x] إنشاء ManufacturingOrderService مع دوال CRUD وإنشاء أوامر التصنيع من أوامر البيع
- [x] إنشاء ManufacturingOrderController (endpoints: list, create from sales order, update status/produced)
- [x] تحديث MRP ليشمل الطلب من أوامر التصنيع (بالإضافة إلى جداول الإنتاج)
- [x] تحديث صفحة أوامر البيع: إضافة عمود حالة التصنيع وزر "إرسال للتصنيع"
- [x] إنشاء ARCHITECTURE.md مع توثيق القرارات التقنية (Tech Stack, Feature-based Architecture, إلخ)

### المرحلة 18: توثيق خطوة-بخطوة 🆕
- [x] إنشاء WALKTHROUGH.md — دليل استخدام شامل بالعربية مع مراجع للصور
- [x] إنشاء Cypress screenshot spec (`screenshots.spec.ts`) يزور جميع الصفحات ويلتقط صوراً
- [x] إضافة npm script `screenshots` لالتقاط الصور تلقائياً
- [x] تحسين اختبارات Cypress الموجودة (selectors صحيحة + intercepts)

---

## 📌 ملاحظات هامة

- **Tech Stack:** تم استخدام Next.js + NestJS بدلاً من Flutter + Supabase/Firebase (المذكور في البرومبت الأصلي). هذا قرار معماري يجب توثيقه مع ذكر الأسباب.
- **Clean Architecture:** المشروع الحالي يستخدم feature-based architecture بدلاً من Clean Architecture (data/domain/presentation layers).
- **نظام تسجيل الدخول:** يستخدم البريد الإلكتروني أو الرقم الوظيفي + كلمة مرور، وليس اسم/دور dropdown + كلمة مرور كما في البرومبت الأصلي.
- **جميع صفحات Placeholder:** تم ربط صفحات (Assembly, MRP, Planning, QC, BOM التجميع, Plastic, Packaging) بالنظام الفعلي — لم يعد هناك أي صفحة تعيد التوجيه لـ "تحت الإنشاء".

---

## 📊 إحصائيات المشروع
- **واجهة أمامية:** Next.js 16 + React 19 + TypeScript 5 + TailwindCSS 4
- **خلفية:** NestJS 11 + TypeORM + PostgreSQL
- **ملفات الواجهة:** ~50+ صفحة/مكون
- **موديولات الخلفية:** 18 موديول (auth, users, inventory, sales, purchases, manufacturing, accounting, payroll, reports, dashboard, notifications, audit, وغيرها)
- **حالة الإنجاز الكلي:** ~92% من البرومبت الأصلي

### 🛠️ إصلاحات لاحقة
- [x] إصلاح `tsc --noEmit` errors في ملفات `e2e-spec.ts` (تثبيت `@types/jest@30.0.0` لحل 195 خطأ من Jest globals)

### المرحلة 19: تتبع الإنتاج (Traceability) 🆕
- [x] إنشاء entity ProductionBatch (batch_number auto-generated, status, expiry, product link)
- [x] إنشاء entity BatchComponent (يربط المواد الخام/الأكسسوارات بالدفعة مع batch المورد)
- [x] إنشاء TraceabilityService (CRUD + تتبع أمامي/عكسي + recall + منتهية الصلاحية)
- [x] إنشاء TraceabilityController (6 endpoints: list, detail, create, status update, recall, trace)
- [x] تسجيل entities + service + controller في ManufacturingModule
- [x] إضافة دوال API في frontend (getBatches, createBatch, updateStatus, recall, forward/backward trace)
- [x] إعادة كتابة صفحة التتبع (قائمة دفعات + فلترة + تتبع أمامي)
- [x] إنشاء صفحة تفاصيل الدفعة (معلومات + مكونات + تغيير الحالة + سحب)
- [x] إضافة رابط التتبع في صفحة التصنيع الرئيسية

### المرحلة 20: إنتاج التجميع (Assembly Production) 🆕
- [x] ربط جدول تاريخ الإنتاج الحقيقي (API getAssemblyOrders) في صفحة إنتاج التجميع
- [x] إضافة دالة getAssemblyOrders() في frontend API layer
- [x] استبدال placeholder التاريخ بجدول فعلي يعرض آخر 20 عملية إنتاج

### المرحلة 21: تجهيز النشر (Deploy Preparation) 🆕
- [x] إنشاء Frontend Dockerfile (multi-stage build مع standalone output)
- [x] تفعيل `output: 'standalone'` في next.config.ts
- [x] إنشاء Backend Dockerfile.prod (multi-stage، بدون dev dependencies)
- [x] إنشاء startup.relational.prod.sh (migration + node dist/main)
- [x] تحديث docker-compose.yml ليشمل services: postgres + backend + frontend
- [x] إنشاء backend/.env.production.example مع إعدادات الإنتاج
- [x] ربط جدول تاريخ الإنتاج الحقيقي (API getAssemblyOrders) في صفحة إنتاج التجميع
- [x] إضافة دالة getAssemblyOrders() في frontend API layer
- [x] استبدال placeholder التاريخ بجدول فعلي يعرض آخر 20 عملية إنتاج
- [x] إنشاء entity ProductionBatch (batch_number auto-generated, status, expiry, product link)
- [x] إنشاء entity BatchComponent (يربط المواد الخام/الأكسسوارات بالدفعة مع batch المورد)
- [x] إنشاء TraceabilityService (CRUD + تتبع أمامي/عكسي + recall + منتهية الصلاحية)
- [x] إنشاء TraceabilityController (6 endpoints: list, detail, create, status update, recall, trace)
- [x] تسجيل entities + service + controller في ManufacturingModule
- [x] إضافة دوال API في frontend (getBatches, createBatch, updateStatus, recall, forward/backward trace)
- [x] إعادة كتابة صفحة التتبع (قائمة دفعات + فلترة + تتبع أمامي)
- [x] إنشاء صفحة تفاصيل الدفعة (معلومات + مكونات + تغيير الحالة + سحب)
- [x] إضافة رابط التتبع في صفحة التصنيع الرئيسية
