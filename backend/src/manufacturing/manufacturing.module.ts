import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { MachineService } from './machines/machine.service';
import { MoldService } from './mold.service';
import { FixedCostService } from './fixed-cost.service';
import { BOMService } from './bom.service';
import { RawMaterialService } from './raw-material.service';
import { DailyProductionService } from './daily-production.service';
import { WarehouseHelper } from './warehouse.helper';
import { Machine } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { Mold } from './entities/mold.entity';
import { MoldIssue } from './entities/mold-issue.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { BOM, BOMItem } from './entities/bom.entity';
import { AssemblyOrder } from './entities/assembly-order.entity';
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { AssemblyController } from './assembly.controller';
import { AssemblyService } from './assembly.service';
import { Attendance } from './entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { UserEntity as User } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { ProductionSchedule } from './entities/production-schedule.entity';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { QCInspection } from './entities/qc-inspection.entity';
import { QCController } from './qc.controller';
import { QCService } from './qc.service';
import { MRPService } from './mrp.service';
import { MRPController } from './mrp.controller';
import { ProductionFeasibilityService } from './production-feasibility.service';
import { FeasibilityAnalysisService } from './feasibility/feasibility-analysis.service';
import { ProductionFeasibilityController } from './production-feasibility.controller';
import { FeasibilityReportEntity } from './entities/feasibility-report.entity';
import { ManufacturingOrder } from './entities/manufacturing-order.entity';
import { ManufacturingOrderService } from './manufacturing-order.service';
import { ManufacturingOrderController } from './manufacturing-order.controller';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { AccountingModule } from '../accounting/accounting.module';
import { ProductionBatch } from './entities/production-batch.entity';
import { BatchComponent } from './entities/batch-component.entity';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
import { TraceabilityService } from './traceability.service';
import { TraceabilityController } from './traceability.controller';
import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';

@Module({
  imports: [
    AccountingModule,
    TypeOrmModule.forFeature([
      Machine,
      MachineMaintenance,
      Mold,
      MoldIssue,
      DailyProduction,
      BOM,
      BOMItem,
      AssemblyOrder,
      RawMaterialConsumption,
      SupplierMaterial,
      FixedCost,
      Product,
      Stock,
      StockMovement,
      Warehouse,
      Attendance,
      User,
      ProductionSchedule,
      QCInspection,
      PurchaseOrder,
      PurchaseOrderItem,
      ManufacturingOrder,
      SalesOrder,
      SalesOrderItem,
      ProductionBatch,
      BatchComponent,
      FeasibilityReportEntity,
      RangeProductionSession,
      ProductionRecordHistory,
    ]),
  ],
  controllers: [
    ManufacturingController,
    AssemblyController,
    AttendanceController,
    PlanningController,
    QCController,
    MRPController,
    ManufacturingOrderController,
    TraceabilityController,
    ProductionFeasibilityController,
    AccessoriesController,
  ],
  providers: [
    ManufacturingService,
    MachineService,
    MoldService,
    FixedCostService,
    BOMService,
    RawMaterialService,
    DailyProductionService,
    WarehouseHelper,
    AssemblyService,
    AttendanceService,
    PlanningService,
    QCService,
    MRPService,
    ManufacturingOrderService,
    TraceabilityService,
    ProductionFeasibilityService,
    FeasibilityAnalysisService,
    AccessoriesService,
  ],
  exports: [ManufacturingService, AssemblyService, AttendanceService],
})
export class ManufacturingModule {}
