import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { DataSource } from 'typeorm';

describe('PurchasesService', () => {
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'SupplierRepository',
          useValue: {},
        },
        {
          provide: 'PurchaseOrderRepository',
          useValue: {},
        },
        {
          provide: 'PurchaseOrderItemRepository',
          useValue: {},
        },
        {
          provide: 'SupplierPaymentRepository',
          useValue: {},
        },
        {
          provide: 'PurchaseReturnRepository',
          useValue: {},
        },
        {
          provide: 'PurchaseReturnItemRepository',
          useValue: {},
        },
        {
          provide: 'CurrencyRepository',
          useValue: {},
        },
        {
          provide: 'FxRateRepository',
          useValue: {},
        },
        {
          provide: 'ContainerRepository',
          useValue: {},
        },
        {
          provide: 'PackingListRepository',
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
          provide: InventoryService,
          useValue: {},
        },
        {
          provide: AccountingService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        PurchasesService,
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
