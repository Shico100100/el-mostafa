# Manufacturing Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract inline stock operations from ManufacturingService into WarehouseHelper, and remove ~40 pass-through delegate methods from ManufacturingService by having ManufacturingController inject sub-services directly.

**Architecture:** Two independent parts executed sequentially: (1) add stock helpers to WarehouseHelper + refactor ManufacturingService to use them, (2) remove pass-through delegates from ManufacturingService + update ManufacturingController. Summary: -180 lines ManufacturingService, +120 lines WarehouseHelper.

**Tech Stack:** NestJS, TypeORM, TypeScript

## Global Constraints

- All changes must pass `npx tsc --noEmit` with zero errors
- Arabic error messages must be preserved exactly
- All `EntityManager`-based helpers must NOT manage transactions themselves (caller controls the transaction)
- Keep the same response shapes for all controller endpoints
- Follow the same refactoring pattern as PurchasesService/SalesService pass-through removal (Tasks 5d/5e)

---

### Task 1: Add stock helper methods to WarehouseHelper

**Files:**
- Modify: `src/manufacturing/warehouse.helper.ts`
- Modify: `src/manufacturing/warehouse.helper.ts` (same file, 6 new methods at end, before closing brace)

**Interfaces:**
- Consumes: existing `WarehouseHelper` constructor (already has `@InjectRepository(Warehouse)`, `@InjectRepository(Stock)`, `@InjectRepository(Product)`)
- Produces: `deductRawMaterialStock(productId, quantity, reference, manager)`, `reverseRawMaterialStock(productId, quantity, reference, manager)`, `addSemiFinishedStock(moldName, pieces, cost, plasticWhId, reference, manager)`, `reverseSemiFinishedStock(moldName, pieces, plasticWhId, reference, manager)`, `processBOMConsumption(bom, pieces, productionId, manager)`, `reverseBOMConsumption(bom, pieces, productionId, manager)`

- [ ] **Step 1: Add `deductRawMaterialStock` method**

```typescript
async deductRawMaterialStock(
  productId: number,
  quantity: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const stockRepo = manager.getRepository(Stock);
  const stock = await stockRepo.findOne({ where: { product_id: productId } });
  if (!stock || Number(stock.quantity) < quantity) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    throw new BadRequestException(
      `رصيد غير كافٍ للمادة الخام: ${product?.name || 'غير معروف'} (المطلوب: ${quantity}, المتوفر: ${stock ? Number(stock.quantity) : 0})`,
    );
  }
  stock.quantity = Number(stock.quantity) - quantity;
  await stockRepo.save(stock);
  const stockMovementRepo = manager.getRepository(StockMovement);
  await stockMovementRepo.save({
    product_id: productId,
    warehouse_id: stock.warehouse_id,
    type: MovementType.OUT,
    quantity,
    reference_type: reference.type,
    reference_id: reference.id,
    date: new Date(),
    notes: `Used in production: ${reference.id}`,
  });
}
```

For this to work, add to the imports:
```typescript
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';
```

- [ ] **Step 2: Add `reverseRawMaterialStock` method**

```typescript
async reverseRawMaterialStock(
  productId: number,
  quantity: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const stockRepo = manager.getRepository(Stock);
  const stock = await stockRepo.findOne({ where: { product_id: productId } });
  if (stock) {
    stock.quantity = Number(stock.quantity) + quantity;
    await stockRepo.save(stock);
    const stockMovementRepo = manager.getRepository(StockMovement);
    await stockMovementRepo.save({
      product_id: productId,
      warehouse_id: stock.warehouse_id,
      type: MovementType.IN,
      quantity,
      reference_type: reference.type,
      reference_id: reference.id,
      date: new Date(),
      notes: `Reversal of Production #${reference.id}`,
    });
  }
}
```

- [ ] **Step 3: Add `addSemiFinishedStock` method**

```typescript
async addSemiFinishedStock(
  moldName: string,
  pieces: number,
  overheadCost: number | undefined,
  plasticWhId: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const productRepo = manager.getRepository(Product);
  const stockRepo = manager.getRepository(Stock);
  const stockMovementRepo = manager.getRepository(StockMovement);

  const productName = `بلاستيك ${moldName}`;
  let product = await productRepo.findOne({
    where: { name: productName, type: 'SEMI_FINISHED' },
  });
  if (!product) {
    product = productRepo.create({
      name: productName,
      type: 'SEMI_FINISHED',
      unit: 'piece',
      cost_price: 0,
      selling_price: 0,
    });
    product = await productRepo.save(product);
  }
  let productStock = await stockRepo.findOne({
    where: { product_id: product.id },
  });
  if (!productStock) {
    productStock = stockRepo.create({
      product_id: product.id,
      warehouse_id: plasticWhId,
      quantity: 0,
    });
  }
  const oldStockQty = Number(productStock.quantity || 0);
  const oldCost = Number(product.cost_price || 0);
  const newPieces = Number(pieces);
  const wac =
    oldStockQty + newPieces > 0
      ? (oldStockQty * oldCost + newPieces * (overheadCost || 0)) /
        (oldStockQty + newPieces)
      : overheadCost || 0;
  await productRepo.update(product.id, { cost_price: wac });
  productStock.quantity = Number(productStock.quantity) + newPieces;
  await stockRepo.save(productStock);
  await stockMovementRepo.save({
    product_id: product.id,
    warehouse_id: stock?.warehouse_id || plasticWhId,
    type: MovementType.IN,
    quantity: pieces,
    reference_type: reference.type,
    reference_id: reference.id,
    date: new Date(),
    notes: `Production #${reference.id}`,
  });
}
```

Wait — `stock` is `productStock` here. Let me fix that variable reference in the StockMovement save:

```typescript
  await stockMovementRepo.save({
    product_id: product.id,
    warehouse_id: productStock.warehouse_id || plasticWhId,
    type: MovementType.IN,
    quantity: pieces,
    reference_type: reference.type,
    reference_id: reference.id,
    date: new Date(),
    notes: `Production #${reference.id}`,
  });
```

- [ ] **Step 4: Add `reverseSemiFinishedStock` method**

```typescript
async reverseSemiFinishedStock(
  moldName: string,
  pieces: number,
  plasticWhId: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const productRepo = manager.getRepository(Product);
  const stockRepo = manager.getRepository(Stock);
  const stockMovementRepo = manager.getRepository(StockMovement);

  const productName = `بلاستيك ${moldName}`;
  const product = await productRepo.findOne({
    where: { name: productName, type: 'SEMI_FINISHED' },
  });
  if (product) {
    const stock = await stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (stock) {
      if (Number(stock.quantity) < pieces) {
        throw new BadRequestException(
          `رصيد غير كافٍ لعكس الإنتاج: ${product.name} (المطلوب: ${pieces}, المتوفر: ${stock.quantity})`,
        );
      }
      stock.quantity = Number(stock.quantity) - pieces;
      await stockRepo.save(stock);
      await stockMovementRepo.save({
        product_id: product.id,
        warehouse_id: stock.warehouse_id || plasticWhId,
        type: MovementType.OUT,
        quantity: pieces,
        reference_type: reference.type,
        reference_id: reference.id,
        date: new Date(),
        notes: `Reversal of Production #${reference.id}`,
      });
    }
  }
}
```

- [ ] **Step 5: Add `processBOMConsumption` method**

```typescript
async processBOMConsumption(
  bom: any,
  pieces: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const stockRepo = manager.getRepository(Stock);
  const stockMovementRepo = manager.getRepository(StockMovement);
  for (const item of bom.items) {
    const requiredQty = Number(item.quantity) * Number(pieces);
    const itemStock = await stockRepo.findOne({
      where: { product_id: item.product_id },
    });
    if (itemStock) {
      if (Number(itemStock.quantity) < requiredQty) {
        throw new BadRequestException(
          `رصيد غير كافٍ لمكون BOM: ${item.product?.name || 'غير معروف'} (المطلوب: ${requiredQty}, المتوفر: ${itemStock.quantity})`,
        );
      }
      itemStock.quantity = Number(itemStock.quantity) - requiredQty;
      await stockRepo.save(itemStock);
      await stockMovementRepo.save({
        product_id: item.product_id,
        warehouse_id: itemStock.warehouse_id,
        type: MovementType.OUT,
        quantity: requiredQty,
        reference_type: reference.type,
        reference_id: reference.id,
        date: new Date(),
        notes: `BOM Deduction for Production #${reference.id}`,
      });
    }
  }
}
```

- [ ] **Step 6: Add `reverseBOMConsumption` method**

```typescript
async reverseBOMConsumption(
  bom: any,
  pieces: number,
  reference: { type: string; id: number },
  manager: any,
): Promise<void> {
  const stockRepo = manager.getRepository(Stock);
  const stockMovementRepo = manager.getRepository(StockMovement);
  for (const item of bom.items) {
    const requiredQty = Number(item.quantity) * Number(pieces);
    const itemStock = await stockRepo.findOne({
      where: { product_id: item.product_id },
    });
    if (itemStock) {
      itemStock.quantity = Number(itemStock.quantity) + requiredQty;
      await stockRepo.save(itemStock);
      await stockMovementRepo.save({
        product_id: item.product_id,
        warehouse_id: itemStock.warehouse_id,
        type: MovementType.IN,
        quantity: requiredQty,
        reference_type: reference.type,
        reference_id: reference.id,
        date: new Date(),
        notes: `BOM Reversal for Production #${reference.id}`,
      });
    }
  }
}
```

- [ ] **Step 7: Run tsc to verify**

Run: `cd backend && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 8: Commit**

```powershell
git add src/manufacturing/warehouse.helper.ts
git commit -m "feat(phase2): add 6 stock helper methods to WarehouseHelper"
```

---

### Task 2: Replace inline stock ops in ManufacturingService with WarehouseHelper calls

**Files:**
- Modify: `src/manufacturing/manufacturing.service.ts` — replace inline `manager.getRepository(Stock)` blocks with `this.warehouseHelper.xxx()` calls

**Interfaces:**
- Consumes: `this.warehouseHelper` already injected in constructor (line 43)
- Consumes: the 6 new methods from Task 1

The following methods contain inline stock operations that need replacement:

**2a: `createProduction`** (lines 379-551)
Replace three inline stock blocks:
1. Semi-finished addition (lines 388-427) → `this.warehouseHelper.addSemiFinishedStock(mold.name, data.pieces_produced, overheadCost, plasticWhId, { type: 'PRODUCTION', id: saved.id }, manager)`
2. Raw material deduction (lines 475-511) → `this.warehouseHelper.deductRawMaterialStock(effectiveRmId, data.total_production_kg, { type: 'PRODUCTION', id: saved.id }, manager)`
3. BOM consumption (lines 513-549) → `this.warehouseHelper.processBOMConsumption(bom, data.pieces_produced, { type: 'PRODUCTION_BOM', id: saved.id }, manager)`

Remove the now-unused `stockRepo`, `stockMovementRepo` variables from the transaction callback.

**2b: `deleteProduction`** (lines 675-801)
Replace three inline stock blocks:
1. Raw material reversal (lines 689-713) → `this.warehouseHelper.reverseRawMaterialStock(production.product_id, production.total_production_kg, { type: 'PRODUCTION_DELETE', id }, manager)`
2. Semi-finished reversal (lines 715-747) → `this.warehouseHelper.reverseSemiFinishedStock(production.mold.name, production.pieces_produced, plasticWhId, { type: 'PRODUCTION_DELETE', id }, manager)`
3. BOM reversal (lines 749-781) → `this.warehouseHelper.reverseBOMConsumption(bom, production.pieces_produced, { type: 'PRODUCTION_BOM_DELETE', id }, manager)`

Remove `stockRepo`, `stockMovementRepo` variable declarations. Keep `productRepo`, `bomRepo`, `historyRepo` as they're still needed.

**2c: `updateProduction`** (lines 834-1007)
Replace four inline stock blocks:
1. Old raw material reversal (lines 841-866) → `this.warehouseHelper.reverseRawMaterialStock(oldProduction.product_id, oldProduction.total_production_kg, { type: 'PRODUCTION_CORRECTION', id }, manager)`
2. Old semi-finished reversal (lines 868-900) → `this.warehouseHelper.reverseSemiFinishedStock(oldProduction.mold.name, oldProduction.pieces_produced, plasticWhId, { type: 'PRODUCTION_CORRECTION', id }, manager)`
3. New raw material deduction (lines 910-946) → `this.warehouseHelper.deductRawMaterialStock(updatedProduction.product_id, updatedProduction.total_production_kg, { type: 'PRODUCTION', id }, manager)`
4. New semi-finished addition (lines 948-984) → `this.warehouseHelper.addSemiFinishedStock(updatedProduction.mold.name, updatedProduction.pieces_produced, undefined, plasticWhId, { type: 'PRODUCTION', id }, manager)`

Remove `stockRepo`, `stockMovementRepo` variable declarations. The `productRepo` is still used for product lookups.

**2d: `createAssembly`** (lines 1059-1144)
Replace two inline stock blocks:
1. BOM deduction loop (lines 1068-1106) — the first `stockRepo.findOne` block at 1070-1080 is a VALIDATION check (not a mutation), keep it. The actual deduction loop at 1082-1106 uses `warehouseHelper.safeDeductStock` already — good. But the stock movement saving at 1094-1105 is duplicated with the helper. Replace the second loop (1082-1106) with:
   ```
   this.warehouseHelper.processBOMConsumption(bom, data.quantity, { type: 'ASSEMBLY', id: 0 }, manager)
   ```
   Wait — actually `createAssembly` already uses `warehouseHelper.safeDeductStock` for the deduction. But then it also does inline stockMovementRepo.save(). Let me look more carefully...

   Actually, `processBOMConsumption` does BOTH deduction AND stock movement creation, which is what lines 1082-1106 do. So replace lines 1082-1106 with:
   ```
   await this.warehouseHelper.processBOMConsumption(bom, data.quantity, { type: 'ASSEMBLY', id: 0 }, manager);
   ```
   Remove the `stockRepo`, `stockMovementRepo` variables. The finished stock addition block (lines 1108-1132) stays inline as it's a different pattern not covered by our helpers.

Also needed: remove `import { Stock } from '../inventory/entities/stock.entity';` and `import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';` from ManufacturingService imports (they're no longer needed directly since WarehouseHelper handles them).

- [ ] **Step 1: Refactor `createProduction`** — replace 3 inline stock blocks with helper calls

- [ ] **Step 2: Refactor `deleteProduction`** — replace 3 inline stock blocks with helper calls

- [ ] **Step 3: Refactor `updateProduction`** — replace 4 inline stock blocks with helper calls

- [ ] **Step 4: Refactor `createAssembly`** — replace inline BOM deduction loop with `processBOMConsumption`

- [ ] **Step 5: Remove unused Stock/StockMovement imports** from manufacturing.service.ts

- [ ] **Step 6: Run tsc to verify**

Run: `cd backend && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 7: Commit**

```powershell
git add src/manufacturing/manufacturing.service.ts
git commit -m "refactor(phase2): replace inline stock ops with WarehouseHelper calls"
```

---

### Task 3: Remove pass-through delegates from ManufacturingService + update controller

**Files:**
- Modify: `src/manufacturing/manufacturing.controller.ts` — add 6 service imports, update constructor, redirect ~40 endpoints
- Modify: `src/manufacturing/manufacturing.service.ts` — remove ~40 delegate methods

**Interfaces:**
- Consumes (controller): MachineService, MoldService, FixedCostService, BOMService, RawMaterialService, DailyProductionService
- Consumes (service): the new helpers from Task 1
- Produces: Controller with 6 injected services, ManufacturingService with only complex methods remaining

**3a: Update ManufacturingController**

Add imports:
```typescript
import { MachineService } from './machines/machine.service';
import { MoldService } from './mold.service';
import { FixedCostService } from './fixed-cost.service';
import { BOMService } from './bom.service';
import { RawMaterialService } from './raw-material.service';
import { DailyProductionService } from './daily-production.service';
```

Update constructor:
```typescript
constructor(
  private manufacturingService: ManufacturingService,
  private machineService: MachineService,
  private moldService: MoldService,
  private fixedCostService: FixedCostService,
  private bomService: BOMService,
  private rawMaterialService: RawMaterialService,
  private dailyProductionService: DailyProductionService,
) {}
```

**3b: Redirect endpoints to sub-services**

| Endpoint | Change from `this.manufacturingService.xxx()` to: |
|---|---|
| GET /export/machines | `this.machineService.exportMachines()` |
| POST /import/machines | `this.machineService.importMachines(data as any[])` |
| GET /export/molds | `this.moldService.exportMolds()` |
| POST /import/molds | `this.moldService.importMolds(data as any[])` |
| GET /export/raw-materials | `this.rawMaterialService.exportRawMaterials()` |
| POST /import/raw-materials | `this.rawMaterialService.importRawMaterials(data as any[])` |
| GET /machines/:id/history | `this.machineService.getMachineHistory(+id)` |
| GET /molds/:id/history | `this.moldService.getMoldHistory(+id)` |
| GET /boms | `this.bomService.getBOMs(page ? +page : 1, limit ? +limit : 50)` |
| POST /boms | `this.bomService.createBOM(data as unknown as Partial<BOM>)` |
| GET /boms/:id | `this.bomService.getBOM(+id)` |
| PUT /boms/:id | `this.bomService.updateBOM(+id, data)` |
| DELETE /boms/:id | `this.bomService.deleteBOM(+id)` |
| GET /machines/status | `this.machineService.getMachinesWithStatus()` |
| GET /machines | `this.machineService.getAllMachines(page ? +page : 1, limit ? +limit : 50)` |
| GET /machines/overview | `this.machineService.getMachinesOverview({...})` |
| POST /machines | `this.machineService.createMachine(data)` |
| PUT /machines/:id | `this.machineService.updateMachine(+id, data)` |
| GET /maintenance | `this.machineService.getMachineMaintenance(machineId ? +machineId : undefined)` |
| POST /maintenance | `this.machineService.createMaintenance(data)` |
| GET /molds | `this.moldService.getAllMolds(page ? +page : 1, limit ? +limit : 50)` |
| POST /molds | `this.moldService.createMold(data)` |
| PUT /molds/:id | `this.moldService.updateMold(+id, data)` |
| POST /sync-molds | `this.moldService.syncAllMoldProducts()` |
| POST /recalculate-semi-finished-costs | `this.moldService.recalculateSemiFinishedCosts()` |
| GET /semi-finished-products/:id/details | `this.moldService.getSemiFinishedDetails(+id)` |
| GET /mold-issues | `this.moldService.getMoldIssues(moldId ? +moldId : undefined)` |
| POST /mold-issues | `this.moldService.createMoldIssue(data)` |
| PUT /mold-issues/:id | `this.moldService.updateMoldIssue(+id, data)` |
| GET /molds/:id/stats | `this.moldService.getMoldStats(+id)` |
| GET /machines/:id/last-mold | `this.moldService.getLastMoldForMachine(+id)` |
| GET /production | `this.dailyProductionService.getDailyProduction(date, startDate, endDate)` |
| GET /production/sessions | `this.dailyProductionService.getRangeSessions(page ? +page : 1, limit ? +limit : 20)` |
| GET /production/sessions/:id | `this.dailyProductionService.getRangeSessionById(+id)` |
| GET /production/:id/history | `this.dailyProductionService.getProductionHistory(+id)` |
| GET /export/production-history | `this.dailyProductionService.exportProductionHistory()` |
| GET /raw-materials | `this.rawMaterialService.getRawMaterials()` |
| GET /raw-materials/:id | `this.rawMaterialService.getRawMaterial(+id)` |
| POST /raw-materials | `this.rawMaterialService.createRawMaterial(data)` |
| PUT /raw-materials/:id | `this.rawMaterialService.updateRawMaterial(+id, data)` |
| DELETE /raw-materials/:id | `this.rawMaterialService.deleteRawMaterial(+id)` |
| GET /raw-materials/consumption/history | `this.rawMaterialService.getConsumptionHistory(filters)` |
| POST /raw-materials/consumption | `this.rawMaterialService.recordConsumption(data)` |
| GET /raw-materials/alerts/low-stock | `this.rawMaterialService.getLowStockAlerts()` |
| GET /suppliers/:id/materials | `this.rawMaterialService.getSupplierMaterials(+id)` |
| GET /raw-materials/:id/suppliers | `this.rawMaterialService.getMaterialSuppliers(+id)` |
| POST /raw-materials/:id/suppliers | `this.rawMaterialService.addSupplierMaterial({...data, product_id: +id})` |
| PUT /supplier-materials/:id | `this.rawMaterialService.updateSupplierMaterial(+id, data)` |
| GET /boms/:id/cost | `this.bomService.calculateProductionCost(+id, quantity ? +quantity : 1)` |
| GET /boms/:id/explode | `this.bomService.explodeBOM(+id, quantity ? +quantity : 1)` |
| POST /raw-materials/:id/purchase | `this.rawMaterialService.addRawMaterialStock({...})` |
| GET /raw-materials/:id/movements | `this.rawMaterialService.getRawMaterialMovements(+id)` |
| DELETE /stock-movements/:id | `this.rawMaterialService.deleteStockMovement(+id)` |
| GET /stock-movements | `this.rawMaterialService.getAllStockMovements({...})` |
| PUT /stock-movements/:id | `this.rawMaterialService.updateStockMovement(+id, data)` |
| POST /stock-movements | `this.rawMaterialService.createStockMovement(data)` |
| GET /fixed-costs | `this.fixedCostService.getFixedCosts(month, year, page ? +page : 1, limit ? +limit : 50)` |
| POST /fixed-costs | `this.fixedCostService.createFixedCost(data)` |
| DELETE /fixed-costs/:id | `this.fixedCostService.deleteFixedCost(+id)` |
| GET /overhead-rate | `this.fixedCostService.calculateOverheadRate(month)` |
| POST /raw-materials/:id/recalculate | `this.rawMaterialService.recalculateRawMaterialStock(+id)` |

**Methods staying on `this.manufacturingService.xxx()`:**
- GET /stats
- POST /production
- POST /production/range
- PUT /production/:id
- DELETE /production/:id
- DELETE /production/sessions/:id
- POST /assembly
- GET /assembly
- POST /import/production-history

**3c: Remove delegate methods from ManufacturingService**

Remove ALL methods that are pure pass-throughs (about 40 methods across lines 66-321). Only keep:
- `getManufacturingStats` (lines 325-339)
- `createProduction` (lines 341-564) 
- `createRangeProduction` (lines 566-646)
- `getWorkingDaysArray` (private, lines 648-657)
- `deleteRangeSession` (lines 659-673)
- `deleteProduction` (lines 675-801)
- `updateProduction` (lines 803-1008)
- `importProductionHistory` (lines 1010-1057)
- `createAssembly` (lines 1059-1144)
- `getAssemblyOrders` (lines 1146-1151)

Remove all imported service classes no longer needed: `MachineService`, `MoldService`, `FixedCostService`, `BOMService`, `RawMaterialService`, `DailyProductionService`.

Also remove `Logger` import if it was only used in ManufacturingService (verify).

After removal, the remaining constructor should only have:
```typescript
constructor(
  private warehouseHelper: WarehouseHelper,
  private accountingService: AccountingService,
  private dataSource: DataSource,
  @InjectRepository(DailyProduction) private productionRepo: Repository<DailyProduction>,
  @InjectRepository(ProductionRecordHistory) private historyRepo: Repository<ProductionRecordHistory>,
  @InjectRepository(RangeProductionSession) private sessionRepo: Repository<RangeProductionSession>,
  @InjectRepository(Mold) private moldRepo: Repository<Mold>,
  @InjectRepository(Product) private productRepo: Repository<Product>,
  @InjectRepository(BOM) private bomRepo: Repository<BOM>,
  @InjectRepository(AssemblyOrder) private assemblyRepo: Repository<AssemblyOrder>,
  @InjectRepository(Machine) private machineRepo: Repository<Machine>,
) {}
```

- [ ] **Step 1: Update ManufacturingController** — add imports, update constructor, redirect all 40+ endpoints to sub-services

- [ ] **Step 2: Remove delegate methods from ManufacturingService** — remove ~40 methods, clean up imports and constructor params

- [ ] **Step 3: Run tsc to verify**

Run: `cd backend && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```powershell
git add src/manufacturing/manufacturing.controller.ts src/manufacturing/manufacturing.service.ts
git commit -m "refactor(phase2): remove pass-through delegates from manufacturing module"
```

---

### Task 4: Final verification and summary

- [ ] **Step 1: Run final tsc**

Run: `cd backend && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: Check git status**

Run: `git status --short`
Expected: only the 3 modified files (warehouse.helper.ts, manufacturing.service.ts, manufacturing.controller.ts)

- [ ] **Step 3: Show diff stats**

Run: `git diff --stat`
Expected: approximately -180 lines in service, +120 lines in helper, +40 lines changed in controller

- [ ] **Step 4: Commit any remaining changes**

```powershell
git add -A
git commit -m "chore(phase2): finalize manufacturing extraction - verify tsc passes"
```
