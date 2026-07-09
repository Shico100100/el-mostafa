# Backend Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 identified code quality issues in the NestJS backend — register exception filter, fix DTO bypass, eliminate `any` types, extract transaction helper, refactor monolithic services, fix cross-module coupling.

**Architecture:** Issue-by-issue execution in 6 sequential steps. Each step independently verifiable via `npx tsc --noEmit`.

**Tech Stack:** NestJS, TypeORM, TypeScript, class-validator

## Global Constraints

- All changes must pass `npx tsc --noEmit` before moving to next step
- No behavioral changes — refactoring only
- Follow existing patterns (DTO decorators, module structure)
- Don't remove unused npm dependencies (deferred to Phase 6)

---

### Task 1: Register Global Exception Filter + Clean Up Error Handling

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/manufacturing/manufacturing.controller.ts`
- Modify: `backend/src/utils/exception-filter.ts` (read-only check)
- Remove: ad-hoc try-catch blocks in service files

**Interfaces:**
- Consumes: `AllExceptionsFilter` at `backend/src/utils/exception-filter.ts`
- Produces: Registered global exception filter, clean controller error handling

- [ ] **Step 1: Read exception-filter.ts to confirm it exists and understand its structure**

Run: `Get-Content C:\ELMostafa\backend\src\utils\exception-filter.ts | Select-Object -First 20`

Expected: Class `AllExceptionsFilter` implementing `ExceptionFilter` with `catch()` method.

- [ ] **Step 2: Add APP_FILTER provider to app.module.ts**

Edit `backend/src/app.module.ts`:

Add import:
```typescript
import { APP_FILTER } from '@nestjs/core';
```

Already exists. Add to `providers` array:
```typescript
import { AllExceptionsFilter } from './utils/exception-filter';

// In @Module providers array:
{
  provide: APP_FILTER,
  useClass: AllExceptionsFilter,
},
```

- [ ] **Step 3: Verify tsc passes after filter registration**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Remove ad-hoc try-catch blocks from manufacturing.controller.ts**

Read `manufacturing.controller.ts` around lines 402-414, 424-434, 660-673.

For each block, remove the try-catch wrapper but keep the logic inside. The pattern is:
```typescript
// Before:
try {
  const result = await this.manufacturingService.createProduction(data);
  return { message: '...', data: result };
} catch (error) {
  throw new InternalServerErrorException('...');
}

// After:
const result = await this.manufacturingService.createProduction(data);
return { message: '...', data: result };
```

- [ ] **Step 5: Remove noise catch blocks from service files**

Find and remove `catch (err) { throw err; }` patterns in service files:

Search: `grep -n "catch\s*\((err|error)\)\s*{\s*throw\s*(err|error)\s*;\s*}" "C:\ELMostafa\backend\src\**\*.service.ts"`

For each match, remove the entire try-catch wrapper, keeping only the try block content.

- [ ] **Step 6: Final verification**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd C:\ELMostafa
git add backend/src/app.module.ts backend/src/manufacturing/manufacturing.controller.ts
git commit -m "refactor: register global exception filter, remove ad-hoc error handling"
```

---

### Task 2: Fix Purchases Controller — Use DTOs Instead of `any`

**Files:**
- Modify: `backend/src/purchases/purchases.controller.ts`

**Interfaces:**
- Consumes: DTOs from `backend/src/purchases/dto/index.ts`
- Produces: Purchases controller with typed request bodies

- [ ] **Step 1: Read purchases controller and DTO index**

Run: `Get-Content C:\ELMostafa\backend\src\purchases\purchases.controller.ts`

Read the DTO index to see what's exported:
Run: `Get-Content C:\ELMostafa\backend\src\purchases\dto\index.ts`

Also read individual DTOs to confirm field names:
Run: `Get-ChildItem C:\ELMostafa\backend\src\purchases\dto\*.ts`

- [ ] **Step 2: Update imports in purchases.controller.ts**

Add imports for all DTOs used by the controller:
```typescript
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateSupplierPaymentDto,
  CreateSupplierMaterialDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreatePurchaseReturnDto,
} from './dto';
```

- [ ] **Step 3: Replace @Body() data: any with typed DTOs for each endpoint**

Replace each endpoint. Key mappings:

| Current | Replace with |
|---------|-------------|
| `createSupplier(@Body() data: any)` | `createSupplier(@Body() createSupplierDto: CreateSupplierDto)` |
| `updateSupplier(@Param('id') id: number, @Body() data: any)` | `updateSupplier(@Param('id') id: number, @Body() updateSupplierDto: UpdateSupplierDto)` |
| `createOrder(@Body() data: any)` | `createOrder(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto)` |
| `updateOrder(@Param('id') id: number, @Body() data: any)` | `updateOrder(@Param('id') id: number, @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto)` |
| `addSupplierPayment(@Body() data: any)` | `addSupplierPayment(@Body() createSupplierPaymentDto: CreateSupplierPaymentDto)` |
| `addSupplierMaterial(@Body() data: any)` | `addSupplierMaterial(@Body() createSupplierMaterialDto: CreateSupplierMaterialDto)` |
| `createReturn(@Body() data: any)` | `createReturn(@Body() createPurchaseReturnDto: CreatePurchaseReturnDto)` |
| `getAllOrders(@Query() query: any)` | `getAllOrders(@Query() query: Record<string, any>)` |

For each replacement, also update the method body to use the typed parameter name (e.g., `data.supplierId` → `createPurchaseOrderDto.supplierId`).

- [ ] **Step 4: Verify compilation**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd C:\ELMostafa
git add backend/src/purchases/purchases.controller.ts
git commit -m "refactor: replace any types with DTOs in purchases controller"
```

---

### Task 3: Eliminate `any` Types Systematically

**Files:**
- Modify: `backend/src/manufacturing/manufacturing.service.ts`
- Modify: `backend/src/inventory/inventory.service.ts`
- Modify: `backend/src/manufacturing/bom.service.ts`
- Modify: `backend/src/manufacturing/raw-material.service.ts`
- Modify: `backend/src/manufacturing/accessories.service.ts`
- Modify: `backend/src/sales/sales.controller.ts`
- Modify: `backend/src/purchases/purchases.service.ts`
- Modify: `backend/src/sales/sales.service.ts`
- Modify: Remaining service files with `: any`

**Interfaces:**
- Consumes: Existing DTO types, entity types from TypeORM
- Produces: Backend with 80+ `any` types replaced

- [ ] **Step 3a: Replace `any` types in manufacturing.service.ts**

Read the file: `Get-Content C:\ELMostafa\backend\src\manufacturing\manufacturing.service.ts`

Pattern A — delegation methods:
```typescript
// Before:
async createMachine(data: any) {
  return this.machineService.createMachine(data);
}
// After:
async createMachine(data: CreateMachineDto) {
  return this.machineService.createMachine(data);
}
```

Add imports for needed DTOs. For each delegation method, find the sub-service's method signature and use that parameter type.

Pattern B — catch blocks:
```typescript
// Before:
catch (err: any) {
// After:
catch (err: unknown) {
```

If the catch block only re-throws, remove the try-catch entirely.

- [ ] **Step 3b: Replace `any` types in inventory.service.ts**

Same pattern as 3a. Focus on delegation methods and query builders.

Pattern C — dynamic query builders:
```typescript
// Before:
const where: any = {};
if (filters.categoryId) where.categoryId = filters.categoryId;
if (filters.type) where.type = filters.type;

// After:
import { FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';

const where: FindOptionsWhere<Product> = {};
if (filters.categoryId) where.categoryId = filters.categoryId;
if (filters.type) where.type = filters.type as Product['type'];
```

- [ ] **Step 3c: Fix bom.service.ts `any` types**

Read `bom.service.ts` and replace:
```typescript
// Before:
const components: any[] = [];
data.items.map((i: any) => {
// After:
import { CreateBOMItemDto } from './dto/create-bom-item.dto';

const components: CreateBOMItemDto[] = [];
data.items.map((i: CreateBOMItemDto) => {
```

- [ ] **Step 3d: Fix raw-material.service.ts `any` types**

Replace `let suppliers: any[] = []` with proper type, `const where: any = {}` with `FindOptionsWhere<Product>`.

- [ ] **Step 3e: Fix accessories.service.ts `any` types**

Replace `rows.map((p: any)` with typed parameter, `let suppliers: any[]` with typed array.

- [ ] **Step 3f: Fix sales.controller.ts and remaining files**

```typescript
// Before:
getAllOrders(@Query() query: any)
// After:
getAllOrders(@Query() query: Record<string, any>)
```

Search for all remaining `: any` in service files with grep:
Run: `rg ":\s*any" C:\ELMostafa\backend\src --include="*.service.ts" --include="*.controller.ts"`

Fix each occurrence.

- [ ] **Step 3g: Enable noImplicitAny in tsconfig**

Read `backend/tsconfig.json`, add `"noImplicitAny": true` to `compilerOptions`.

- [ ] **Step 3h: Verify**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3i: Commit**

```bash
cd C:\ELMostafa
git add backend/src/ backend/tsconfig.json
git commit -m "refactor: eliminate any types across backend services"
```

---

### Task 4: Create Transaction Helper Utility

**Files:**
- Create: `backend/src/common/transaction.helper.ts`
- Modify: `backend/src/common/common.module.ts`
- Modify: `backend/src/inventory/inventory.service.ts`
- Modify: `backend/src/manufacturing/manufacturing.service.ts`

**Interfaces:**
- Consumes: `DataSource`, `EntityManager` from TypeORM
- Produces: `TransactionHelper` with `runInTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T>`

- [ ] **Step 4a: Create transaction.helper.ts**

Write to `backend/src/common/transaction.helper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TransactionHelper {
  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await fn(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

- [ ] **Step 4b: Register TransactionHelper in common.module.ts**

Read `common.module.ts`. Add `TransactionHelper` to `providers` and `exports` arrays.

```typescript
import { TransactionHelper } from './transaction.helper';

@Module({
  providers: [TransactionHelper],
  exports: [TransactionHelper],
})
```

- [ ] **Step 4c: Replace transaction boilerplate in inventory.service.ts**

Read inventory.service.ts and find all transaction blocks (search for `createQueryRunner`).

Before:
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // ... business logic using queryRunner.manager ...
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

After:
```typescript
await this.transactionHelper.runInTransaction(async (manager) => {
  // ... same business logic using manager instead of queryRunner.manager ...
});
```

Inject `TransactionHelper` in constructor:
```typescript
constructor(
  // ... existing injections ...
  private readonly transactionHelper: TransactionHelper,
) {}
```

- [ ] **Step 4d: Replace transaction boilerplate in manufacturing.service.ts**

Same pattern as 4c. Find all `createQueryRunner` calls and replace.

- [ ] **Step 4e: Verify**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4f: Commit**

```bash
cd C:\ELMostafa
git add backend/src/common/transaction.helper.ts backend/src/common/common.module.ts backend/src/inventory/inventory.service.ts backend/src/manufacturing/manufacturing.service.ts
git commit -m "refactor: extract transaction helper utility"
```

---

### Task 5: Refactor Monolithic Service Files

**Files:**
- Create: `backend/src/manufacturing/production-stock.service.ts`
- Create: `backend/src/manufacturing/production-schedule.service.ts`
- Modify: `backend/src/manufacturing/manufacturing.service.ts`
- Modify: `backend/src/manufacturing/manufacturing.module.ts`
- Modify: `backend/src/purchases/purchases.service.ts`
- Modify: `backend/src/purchases/purchases.module.ts`
- Modify: `backend/src/sales/sales.service.ts`
- Modify: `backend/src/sales/sales.module.ts`

**Interfaces:**
- Consumes: Existing TypeORM repositories, sub-services
- Produces: Smaller focused services with extracted domain logic

- [ ] **Step 5a: Read manufacturing.service.ts to understand all methods**

Read the full file: `Get-Content C:\ELMostafa\backend\src\manufacturing\manufacturing.service.ts`

Identify methods that are:
- **Stock-related**: addRawMaterialStock, deleteRawMaterialStock, addSemiFinishedStock, etc. → extract to ProductionStockService
- **Schedule-related**: production scheduling, capacity planning → extract to ProductionScheduleService
- **Pure CRUD orchestration**: createProduction, updateProduction, deleteProduction, getProductions → keep in ManufacturingService

- [ ] **Step 5b: Create ProductionStockService**

Write to `backend/src/manufacturing/production-stock.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionHelper } from '../common/transaction.helper';

@Injectable()
export class ProductionStockService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
    // ... inject relevant repositories
  ) {}

  // Extract all stock movement methods from ManufacturingService here:
  // - addRawMaterialStock
  // - deleteRawMaterialStock
  // - addSemiFinishedStock
  // - updateStockOnProductionCreate
  // - updateStockOnProductionDelete
  // - updateStockOnProductionUpdate
}
```

Copy the stock-related methods from ManufacturingService verbatim.

- [ ] **Step 5c: Create ProductionScheduleService**

Write to `backend/src/manufacturing/production-schedule.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductionScheduleService {
  // Extract scheduling/planning methods from ManufacturingService
}
```

- [ ] **Step 5d: Refactor ManufacturingService to delegate to new services**

Update `ManufacturingService`:
1. Add imports for `ProductionStockService` and `ProductionScheduleService`
2. Replace duplicated stock logic with delegation calls
3. Keep only orchestration methods (createProduction, updateProduction, deleteProduction, etc.)
4. Remove methods that are now in extracted services
5. Add `ProductionStockService` and `ProductionScheduleService` to constructor

- [ ] **Step 5e: Refactor PurchasesService — remove pass-through delegations**

Read `purchases.service.ts`.

Identify methods that are pure pass-throughs to sub-services:
```typescript
// Before (removing):
async createSupplier(data: CreateSupplierDto) {
  return this.supplierService.create(data);
}
async getAllSuppliers(page = 1, limit = 50) {
  return this.supplierService.findAll(page, limit);
}
```

Remove these methods from PurchasesService. Update any callers within the file to use the sub-service directly instead of `this.createSupplier(data)` → `this.supplierService.create(data)`.

Keep only cross-cutting orchestration methods (aging reports, supplier statements).

Update `purchases.module.ts` if needed.

- [ ] **Step 5f: Refactor SalesService — remove pass-through delegations**

Same pattern as 5e for SalesService. Remove pass-throughs to CustomerService, SalesOrderService, QuoteService.

Keep cross-cutting orchestration.

Update `sales.module.ts` if needed.

- [ ] **Step 5g: Verify**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 5h: Commit**

```bash
cd C:\ELMostafa
git add backend/src/manufacturing/ backend/src/purchases/ backend/src/sales/
git commit -m "refactor: split monolithic services into focused domain services"
```

---

### Task 6: Fix Cross-Module Coupling

**Files:**
- Modify: `backend/src/manufacturing/manufacturing.module.ts`
- Modify: `backend/src/inventory/inventory.module.ts`

- [ ] **Step 6a: Read manufacturing.module.ts and inventory.module.ts**

Read both module files to understand current entity imports.

- [ ] **Step 6b: Fix manufacturing.module.ts imports**

Ensure ManufacturingModule imports InventoryModule, PurchasesModule, SalesModule instead of importing their entity files directly.

Before:
```typescript
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
// etc.
```

After:
```typescript
import { InventoryModule } from '../inventory/inventory.module';
// and in @Module.imports: InventoryModule,
```

Use TypeORM `forFeature()` only for entities owned by manufacturing itself.

- [ ] **Step 6c: Fix inventory.module.ts imports**

Same pattern — import ManufacturingModule instead of BOM/BOMItem entity files directly.

- [ ] **Step 6d: Verify**

Run: `cd C:\ELMostafa\backend; npx tsc --noEmit`

Expected: No errors. Also verify no circular dependency at startup by running:
`node -e "require('reflect-metadata'); try { require('./dist/main'); } catch(e) { console.log(e.message); }"`

- [ ] **Step 6e: Commit**

```bash
cd C:\ELMostafa
git add backend/src/manufacturing/manufacturing.module.ts backend/src/inventory/inventory.module.ts
git commit -m "refactor: fix cross-module coupling via proper module imports"
```
