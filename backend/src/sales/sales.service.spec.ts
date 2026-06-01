import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { DataSource } from 'typeorm';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'CustomerRepository',
          useValue: {},
        },
        {
          provide: 'SalesOrderRepository',
          useValue: {},
        },
        {
          provide: 'SalesOrderItemRepository',
          useValue: {},
        },
        {
          provide: 'QuoteRepository',
          useValue: {},
        },
        {
          provide: 'CustomerPaymentRepository',
          useValue: {},
        },
        {
          provide: 'SalesReturnRepository',
          useValue: {},
        },
        {
          provide: 'SalesReturnItemRepository',
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
        SalesService,
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
