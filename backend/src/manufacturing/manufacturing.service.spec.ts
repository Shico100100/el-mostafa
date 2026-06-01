import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturingService } from './manufacturing.service';
import { AccountingService } from '../accounting/accounting.service';

describe('ManufacturingService', () => {
  let service: ManufacturingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'MachineRepository',
          useValue: {},
        },
        {
          provide: 'MachineMaintenanceRepository',
          useValue: {},
        },
        {
          provide: 'MoldRepository',
          useValue: {},
        },
        {
          provide: 'MoldIssueRepository',
          useValue: {},
        },
        {
          provide: 'DailyProductionRepository',
          useValue: {},
        },
        {
          provide: 'BOMRepository',
          useValue: {},
        },
        {
          provide: 'BOMItemRepository',
          useValue: {},
        },
        {
          provide: 'AssemblyOrderRepository',
          useValue: {},
        },
        {
          provide: 'RawMaterialRepository',
          useValue: {},
        },
        {
          provide: 'RawMaterialConsumptionRepository',
          useValue: {},
        },
        {
          provide: 'SupplierMaterialRepository',
          useValue: {},
        },
        {
          provide: 'ProductRepository',
          useValue: {},
        },
        {
          provide: 'StockRepository',
          useValue: {},
        },
        {
          provide: 'StockMovementRepository',
          useValue: {},
        },
        {
          provide: 'FixedCostRepository',
          useValue: {},
        },
        {
          provide: 'WarehouseRepository',
          useValue: {},
        },
        {
          provide: AccountingService,
          useValue: {},
        },
        ManufacturingService,
      ],
    }).compile();

    service = module.get<ManufacturingService>(ManufacturingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
