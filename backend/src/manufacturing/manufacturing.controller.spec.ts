import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { MachineService } from './machines/machine.service';
import { MoldService } from './mold.service';
import { FixedCostService } from './fixed-cost.service';
import { BOMService } from './bom.service';
import { RawMaterialService } from './raw-material.service';
import { DailyProductionService } from './daily-production.service';

describe('ManufacturingController', () => {
  let controller: ManufacturingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManufacturingController],
      providers: [
        {
          provide: ManufacturingService,
          useValue: {},
        },
        {
          provide: MachineService,
          useValue: {},
        },
        {
          provide: MoldService,
          useValue: {},
        },
        {
          provide: FixedCostService,
          useValue: {},
        },
        {
          provide: BOMService,
          useValue: {},
        },
        {
          provide: RawMaterialService,
          useValue: {},
        },
        {
          provide: DailyProductionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ManufacturingController>(ManufacturingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
