# برنامج إعادة هيكلة (Refactoring Plan)

---

## Backend Services

**الهدف:** تقطيع الـ God-object services الكبيرة إلى domain services صغيرة مركزة، مع الاحتفاظ بـ Facade عشان الـ backward compatibility.

**النمط:**
```
module/
├── module.service.ts          # Facade (يُحقن الـ domain services ويفوض)
├── sub-service-1/
│   └── sub-service-1.service.ts
├── sub-service-2/
│   └── sub-service-2.service.ts
...
└── module.module.ts           # يسجل كل الـ providers
```

### ✅ تم

| الموديول | الملف الأصلي | السطور | بعد التقسيم | التقسيم |
|----------|-------------|--------|-------------|---------|
| Manufacturing | `manufacturing.service.ts` | 3,154 | 680 (Facade) | 7 domain services: Machine, Mold, FixedCost, BOM, RawMaterial, DailyProduction, WarehouseHelper |
| Inventory | `inventory.service.ts` | 1,281 | 245 (Facade) | 4 domain services: Category, Product, Warehouse, Stock |
| Purchases | `purchases.service.ts` | 1,137 | 779 (Facade) | 7 domain services: Supplier, PurchaseOrder, Payment, PurchaseReturn, Currency, Container, PackingList |
| Sales | `sales.service.ts` | 783 | 602 (Facade) | 5 domain services: Customer, SalesOrder, Quote, CustomerPayment, SalesReturn |
| Accessories | `accessories.service.ts` | 628 | 44 (Facade) | 3 sub-services: AccessoryCrud, AccessoryStock, AccessoryExport |
| Production Feasibility | `production-feasibility.service.ts` | 534 | 81 (Facade) | 1 sub-service: FeasibilityAnalysis |
| Reports | `reports.service.ts` | 542 | 45 (Facade) | 2 sub-services: FinancialReport, Analytics |
| Auth | `auth.service.ts` | 679 | 124 (Facade) | 3 sub-services: AuthLogin, AuthRegistration, AuthPassword |
| Product (within Inventory) | `product.service.ts` | 330 | 67 (Facade) | 3 sub-services: ProductCrud, ProductPricing, ProductExcel |
| Accounting | `accounting.service.ts` | 275 | 195 (Facade) | 1 sub-service: AccountCrud |

**Cleanup:**
- إزالة 10 `@InjectRepository` غير مستخدمة + 2 import غير مستخدم (`EntityManager`, `Between`) + `Logger` غير مستخدم من الـ facades
- إزالة 4 `require()` imports (تحويلها إلى ES import)
- إزالة 3 unused imports + 2 unused variables
- تشغيل `prettier --fix` لإصلاح 944 خطأ تنسيق
- `tsc --noEmit` ✅ \| `eslint` ✅ — كلاهما بدون أخطاء

### ✅ تم — جميع خدمات الـ Backend
لم يتبق أي ملف service >200 سطر يحتوي على مسؤوليات متعددة.

### ⏳ ملاحظات
- الـ Facades تحتفظ بـ DataSource transactions والـ cross-repo queries (aging, balance, statement).
- `AuthService` مُصدر للخارج وتستهلكه 3 كنترولرات خارجية (auth-apple, auth-google, auth-facebook).
- `InventoryService` مُصدر للخارج وتستهلكه purchases و sales.

---

## Frontend Pages (Page Refactoring Plan)

**الهدف:**
تطبيق نفس نمط إعادة الهيكلة اللي تم في `/inventory/products` على باقي صفحات البرنامج:
- استخراج المكونات المتكررة (Tables, Modals, StatCards, Pagination, etc.)
- نقل Business Logic إلى Custom Hooks
- إنشاء Layouts مشتركة
- تقليل حجم الصفحات من ~1000 سطر إلى ~100-200 سطر

---

## المبدأ العام

```
frontend/
├── components/
│   └── [module]/
│       ├── types.ts
│       ├── [Entity]Table.tsx
│       ├── [Entity]Form.tsx
│       ├── StatCards.tsx
│       ├── FilterBar.tsx
│       ├── Pagination.tsx
│       └── modals/
│           └── [Entity]Modal.tsx
├── hooks/
│   └── [module]/
│       └── use[Entity].tsx
└── app/
    └── [module]/
        ├── layout.tsx
        └── pages...
```

---

## ✅ تم — جميع صفحات الـ Frontend

| الفئة | العدد |
|-------|-------|
| صفحات refactored | 44 |
| المكونات (`components/`) | 180+ |
| الهوكس (`hooks/`) | 38 |
| أكبر صفحة حجماً | 208 سطر (`manufacturing/daily-production`) |

**الملخص:** جميع الصفحات مقسمة إلى hooks + presentational components، ولا توجد أي صفحة >210 سطر تحتوي على منطق مكرر أو inline logic.
