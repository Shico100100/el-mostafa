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
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Attendance } from './entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { SalesModule } from '../sales/sales.module';
import { JobsModule } from '../jobs/jobs.module';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
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
      UserEntity,
    ]),
  ],
  controllers: [
    ManufacturingController,
    AttendanceController,
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
    AttendanceService,
    AccessoriesService,
  ],
  exports: [ManufacturingService, AttendanceService],
})
export class ManufacturingModule {}
