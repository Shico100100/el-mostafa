# Manufacturing Service Extraction

**Date:** 2026-07-11  
**Status:** Design Approved  
**Phase:** 2 (Backend Code Quality) — Task 5a-c

## Problem

`manufacturing.service.ts` is 1152 lines with three interleaved concerns:
1. ~200 lines of pass-through delegates to sub-services (MachineService, MoldService, FixedCostService, BOMService, RawMaterialService, DailyProductionService)
2. ~670 lines of production CRUD (`createProduction`, `updateProduction`, `deleteProduction`) with inline `manager.getRepository(Stock)` stock operations
3. ~90 lines of assembly logic with inline stock operations

This duplicates stock manipulation patterns across 6+ code paths and couples production business logic to low-level repository calls.

## Scope

### Part A: Pass-through removal

Remove ~25 delegate methods from ManufacturingService that simply call through to sub-services. Update ManufacturingController to inject sub-services directly.

**Sub-services the controller will inject:**
- `MachineService` — machines, maintenance, export/import
- `MoldService` — molds, mold issues, mold stats, mold history, export/import
- `FixedCostService` — fixed costs, overhead rate
- `BOMService` — BOM CRUD, production cost, BOM explosion
- `RawMaterialService` — raw materials CRUD, consumption, supplier materials, stock movements, low stock alerts, export/import
- `DailyProductionService` — production queries (getDailyProduction, getProductionHistory, getRangeSessions, exportHistory)

**Methods staying in ManufacturingService** (complex cross-cutting):
- `getManufacturingStats` — aggregates across multiple repos
- `createProduction` — multi-step transaction: mold calculation, semi-finished + raw + BOM stock ops, cost calculation, accounting entry
- `updateProduction` — reverse old + apply new stock changes, history tracking
- `deleteProduction` — reverse all stock changes, history tracking
- `createRangeProduction` — distributes across working days, calls createProduction
- `deleteRangeSession` — deletes all records in a session, calls deleteProduction
- `createAssembly` — BOM consumption + finished stock addition + order creation
- `getAssemblyOrders` — simple query with relations
- `importProductionHistory` — bulk import, calls createProduction

### Part B: WarehouseHelper stock extraction

Extract 6 inline stock-operation patterns into `warehouse.helper.ts`. Each accepts `EntityManager` for transaction compatibility.

**New methods:**

| Method | Signature | Behavior |
|---|---|---|
| `deductRawMaterialStock` | `(productId, quantity, reference, manager)` | Find stock by productId, check sufficient balance, deduct quantity, create OUT StockMovement |
| `reverseRawMaterialStock` | `(productId, quantity, reference, manager)` | Find stock, add back quantity, create IN StockMovement |
| `addSemiFinishedStock` | `(moldName, pieces, cost, plasticWhId, reference, manager)` | Auto-create/find SEMI_FINISHED product, apply weighted-average cost, add stock, create IN StockMovement |
| `reverseSemiFinishedStock` | `(moldName, pieces, plasticWhId, reference, manager)` | Find semi-finished product, check sufficient balance, deduct stock, create OUT StockMovement |
| `processBOMConsumption` | `(bom, pieces, productionId, manager)` | Iterate BOM items, check each stock, deduct, create OUT StockMovement with PRODUCTION_BOM type |
| `reverseBOMConsumption` | `(bom, pieces, productionId, manager)` | Iterate BOM items, add back each stock, create IN StockMovement with PRODUCTION_BOM_DELETE type |

**Reference type format:** `{ type: 'PRODUCTION' | 'PRODUCTION_DELETE' | 'PRODUCTION_BOM' | 'PRODUCTION_BOM_DELETE' | 'PRODUCTION_CORRECTION' | 'ASSEMBLY', id: number }`

## Files Changed

| File | Change |
|---|---|
| `src/manufacturing/manufacturing.controller.ts` | Import 6 sub-services, update constructor, redirect 25+ endpoints |
| `src/manufacturing/manufacturing.service.ts` | Remove 25+ delegate methods, replace ~80 lines of inline stock ops with WarehouseHelper calls |
| `src/manufacturing/warehouse.helper.ts` | Add 6 new methods (above) |
| `src/inventory/inventory.service.ts` | Add `addStockMovement` overload that accepts `EntityManager` (already partially exists) |

## Not in Scope

- Task 5b (schedule management): Already handled by `PlanningService` — no extraction needed
- Task 5c (factory service split): Machine/Mold/FixedCost/BOM/RawMaterial services already exist as sub-services
- Module coupling: Already handled by Task 6 in Phase 2

## Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Transaction boundary errors | All new helpers accept `EntityManager` — no transaction management inside helpers |
| Arabic error message changes | Keep exact same Arabic error strings as original code |
| Missing a stock edge case | Each replacement is a direct mechanical extraction — same logic, same order of operations |
| Circular dependency | WarehouseHelper stays in manufacturing module (already imports Stock/Product/Warehouse from inventory entities — file-level imports only, not module-level) |

## Verification

- `npx tsc --noEmit` must pass with zero errors
- All endpoints must return the same response shape (verified by controller delegation change)
