import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturingOrdersController } from './manufacturing-orders.controller';
import { ProductionController } from './production.controller';
import { MachinesController } from './machines.controller';
import { MoldsController } from './molds.controller';
import { BOMsController } from './boms.controller';
import { RawMaterialsController } from './raw-materials.controller';
import { MaintenanceController } from './maintenance.controller';
import { FixedCostsController } from './fixed-costs.controller';
import { ManufacturingService } from './manufacturing.service';
import { MachineService } from './machines/machine.service';
import { MoldService } from './mold.service';
import { FixedCostService } from './fixed-cost.service';
import { BOMService } from './bom.service';
import { RawMaterialService } from './raw-material.service';
import { DailyProductionService } from './daily-production.service';

describe('Manufacturing Controllers', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [
        ManufacturingOrdersController,
        ProductionController,
        MachinesController,
        MoldsController,
        BOMsController,
        RawMaterialsController,
        MaintenanceController,
        FixedCostsController,
      ],
      providers: [
        { provide: ManufacturingService, useValue: {} },
        { provide: MachineService, useValue: {} },
        { provide: MoldService, useValue: {} },
        { provide: FixedCostService, useValue: {} },
        { provide: BOMService, useValue: {} },
        { provide: RawMaterialService, useValue: {} },
        { provide: DailyProductionService, useValue: {} },
      ],
    }).compile();
  });

  it('should define ManufacturingOrdersController', () => {
    expect(module.get(ManufacturingOrdersController)).toBeDefined();
  });

  it('should define ProductionController', () => {
    expect(module.get(ProductionController)).toBeDefined();
  });

  it('should define MachinesController', () => {
    expect(module.get(MachinesController)).toBeDefined();
  });

  it('should define MoldsController', () => {
    expect(module.get(MoldsController)).toBeDefined();
  });

  it('should define BOMsController', () => {
    expect(module.get(BOMsController)).toBeDefined();
  });

  it('should define RawMaterialsController', () => {
    expect(module.get(RawMaterialsController)).toBeDefined();
  });

  it('should define MaintenanceController', () => {
    expect(module.get(MaintenanceController)).toBeDefined();
  });

  it('should define FixedCostsController', () => {
    expect(module.get(FixedCostsController)).toBeDefined();
  });
});
