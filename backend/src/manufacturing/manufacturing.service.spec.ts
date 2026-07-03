import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ManufacturingService } from './manufacturing.service';
import { AccountingService } from '../accounting/accounting.service';
import { Machine } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { Mold } from './entities/mold.entity';
import { MoldIssue } from './entities/mold-issue.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { BOM } from './entities/bom.entity';
import { BOMItem } from './entities/bom.entity';
import { AssemblyOrder } from './entities/assembly-order.entity';
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';

describe('ManufacturingService', () => {
  let service: ManufacturingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Machine),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MachineMaintenance),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Mold),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MoldIssue),
          useValue: {},
        },
        {
          provide: getRepositoryToken(DailyProduction),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BOM),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BOMItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AssemblyOrder),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RawMaterialConsumption),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SupplierMaterial),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: {},
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {},
        },
        {
          provide: getRepositoryToken(FixedCost),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RangeProductionSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProductionRecordHistory),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {},
        },
        {
          provide: AccountingService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
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
