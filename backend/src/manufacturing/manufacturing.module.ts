import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesController } from './machines.controller';
import { MoldsController } from './molds.controller';
import { BOMsController } from './boms.controller';
import { RawMaterialsController } from './raw-materials.controller';
import { ManufacturingOrdersController } from './manufacturing-orders.controller';
import { ProductionController } from './production.controller';
import { MaintenanceController } from './maintenance.controller';
import { FixedCostsController } from './fixed-costs.controller';
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
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Attendance } from './entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { SalesModule } from '../sales/sales.module';
import { JobsModule } from '../jobs/jobs.module';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
import { ManufacturingOrder } from './entities/manufacturing-order.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [
    AccountingModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    JobsModule,
    TypeOrmModule.forFeature([
      Machine,
      MachineMaintenance,
      Mold,
      MoldIssue,
      DailyProduction,
      BOM,
      BOMItem,
      RawMaterialConsumption,
      SupplierMaterial,
      FixedCost,
      Attendance,
      RangeProductionSession,
      ProductionRecordHistory,
      ManufacturingOrder,
      UserEntity,
    ]),
  ],
  controllers: [
    MachinesController,
    MoldsController,
    BOMsController,
    RawMaterialsController,
    ManufacturingOrdersController,
    ProductionController,
    MaintenanceController,
    FixedCostsController,
    AttendanceController,
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
    AttendanceService,
  ],
  exports: [ManufacturingService, AttendanceService],
})
export class ManufacturingModule {}
