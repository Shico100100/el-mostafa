# Backend Code Quality — Phase 2 Design

**Date:** 2026-07-09
**Project:** ELMostafa ERP
**Phase:** 2 of 7

---

## Scope

Full quality pass across the NestJS backend (`backend/src/`), covering all 5 identified issues.

---

## Approach

Issue-by-issue execution in 6 sequential steps. Each step is independently verifiable via `npx tsc --noEmit` and independently rollback-able via git.

---

## Step 1: Register Global Exception Filter + Remove Ad-Hoc Error Handling

### What
- Register `AllExceptionsFilter` (exists at `src/utils/exception-filter.ts`) in `app.module.ts` via `APP_FILTER` provider
- Remove manual try-catch blocks in `manufacturing.controller.ts` that wrap errors in `InternalServerErrorException` (lines 402-414, 424-434, 660-673)
- Remove pointless `catch (err) { throw err; }` blocks in service files

### Files
- `backend/src/app.module.ts` — add `APP_FILTER` provider
- `backend/src/manufacturing/manufacturing.controller.ts` — remove 3 try-catch blocks
- ~5 service files — remove noise catches

### Verification
- `npx tsc --noEmit` passes
- All manufacturing endpoints return proper error responses

### Risk
Very low. Filter already exists, just unregistered. Noise catch removal is safe.

---

## Step 2: Fix Purchases Controller DTO Bypass

### What
Replace all 14 `@Body() data: any` occurrences in `purchases.controller.ts` with proper DTO types:
- `CreateSupplierDto`
- `CreatePurchaseOrderDto`
- `CreateSupplierPaymentDto`
- `CreateSupplierMaterialDto`
- `UpdateSupplierDto`
- `UpdatePurchaseOrderDto`

Also fix `: any` in query parameter types.

### Files
- `backend/src/purchases/purchases.controller.ts`

### Verification
- `npx tsc --noEmit` passes
- NestJS ValidationPipe now validates all purchases endpoints

### Risk
Very low. DTOs already exist in `purchases/dto/`. Same pattern used correctly in inventory and sales controllers.

---

## Step 3: Eliminate `any` Types Systematically

### What
Replace `: any` with proper types across all service files. Strategy by pattern:

**Pattern A — Delegation methods** (`createMachine(data: any)`)
→ Use the sub-service's parameter type (e.g., `CreateMachineDto`). Found in `manufacturing.service.ts` (~30 occurrences), `inventory.service.ts` (~8).

**Pattern B — Catch blocks** (`catch (err: any)`)
→ Use `unknown` with type narrowing, or remove the catch entirely if it only re-throws.

**Pattern C — Dynamic query builders** (`const where: any = {}`)
→ Replace with `FindOptionsWhere<Entity>` from TypeORM or properly constructed query objects.

**Pattern D — Array types** (`const components: any[]`)
→ Replace with the specific entity/DTO type.

### Files
- `backend/src/manufacturing/manufacturing.service.ts` (~50 `: any`)
- `backend/src/inventory/inventory.service.ts` (~10)
- `backend/src/manufacturing/bom.service.ts`
- `backend/src/manufacturing/raw-material.service.ts`
- `backend/src/manufacturing/accessories.service.ts`
- `backend/src/sales/sales.controller.ts` (query params)
- `backend/src/purchases/purchases.service.ts`
- `backend/src/sales/sales.service.ts`
- Remaining service files with `: any`

### Verification
- `npx tsc --noEmit --noImplicitAny` passes (add `noImplicitAny: true` to tsconfig as final step)

### Risk
Low-Medium. Most replacements are mechanical. Dynamic query builders need careful typing.

---

## Step 4: Transaction Helper Utility

### What
Extract the repetitive transaction boilerplate into a reusable `TransactionHelper`:

```
createQueryRunner() → connect() → startTransaction() → fn(manager) → commit/rollback → release()
```

### New File
`backend/src/common/transaction.helper.ts`:
```typescript
@Injectable()
export class TransactionHelper {
  constructor(private dataSource: DataSource) {}

  async runInTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const result = await fn(qr.manager);
      await qr.commitTransaction();
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
```

### Modified Files
- `backend/src/inventory/inventory.service.ts` — replace 5+ manual transaction blocks
- `backend/src/manufacturing/manufacturing.service.ts` — replace 3+ manual transaction blocks
- `backend/src/common/common.module.ts` — register `TransactionHelper`

### Verification
- `npx tsc --noEmit` passes
- Inventory and manufacturing transaction flows unchanged

### Risk
Low. Pure refactor — behavior is identical.

---

## Step 5: Refactor Monolithic Service Files

### 5a. ManufacturingService (1092 → ~300 lines)

Extract domains:
- **`ProductionStockService`** — all stock movement logic (raw material deduction, semi-finished addition, finished goods creation), currently duplicated across `createProduction`, `updateProduction`, `deleteProduction`
- **`ProductionScheduleService`** — scheduling, capacity planning, feasibility checks
- Keep in `ManufacturingService`: production CRUD orchestration, date range creation, consumption recording

### 5b. PurchasesService (792 → ~250 lines)

Remove all pass-through delegation methods that just call sub-services (SupplierService, PurchaseOrderService, SupplierPaymentService, CurrencyService). Keep:
- Cross-cutting logic: aging reports, supplier statements, currency conversions
- Purchase approval workflows spanning multiple sub-services

### 5c. SalesService (606 → ~250 lines)

Same pattern as PurchasesService. Remove pass-throughs to sub-services (CustomerService, SalesOrderService, QuoteService). Keep cross-cutting orchestration.

### New Files
- `backend/src/manufacturing/production-stock.service.ts`
- `backend/src/manufacturing/production-schedule.service.ts`

### Modified Files
- `backend/src/manufacturing/manufacturing.service.ts`
- `backend/src/purchases/purchases.service.ts`
- `backend/src/sales/sales.service.ts`
- `backend/src/manufacturing/manufacturing.module.ts` (add new services to providers)
- `backend/src/purchases/purchases.module.ts`
- `backend/src/sales/sales.module.ts`

### Verification
- `npx tsc --noEmit` passes
- All controllers that inject existing services still work (facade methods maintained)
- Manual smoke test of production creation flow

### Risk
Medium. Highest-effort step. Extract boundaries are clear but need careful import updates.

---

## Step 6: Address Cross-Module Coupling

### What
ManufacturingModule imports entities directly from inventory, purchases, and sales modules. InventoryModule also imports BOM/BOMItem from manufacturing (bidirectional).

### Fix
Ensure proper module imports rather than direct entity file imports:
- ManufacturingModule imports InventoryModule, PurchasesModule, SalesModule (instead of entity file paths)
- InventoryModule imports ManufacturingModule (instead of entity file paths)

### Files
- `backend/src/manufacturing/manufacturing.module.ts`
- `backend/src/inventory/inventory.module.ts`

### Verification
- `npx tsc --noEmit` passes
- No circular dependency errors at startup

### Risk
Low-Medium. Module re-exports need care to avoid circular DI errors.

---

## Out of Scope (for this phase)
- Unused DTOs in `frontend/lib/dto.ts` (Phase 3)
- Dependency cleanup (`@nestjs/mongoose`, `@sentry/*`) (Phase 6)
- Python chatbot quality (Phase 7)
