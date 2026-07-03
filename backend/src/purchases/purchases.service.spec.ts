import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PurchasesService } from './purchases.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Currency } from './entities/currency.entity';
import { FxRate } from './entities/fx-rate.entity';
import { Container } from './entities/container.entity';
import { PackingList } from './entities/packing-list.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';


function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('PurchasesService', () => {
  let service: PurchasesService;
  let supplierRepo: jest.Mocked<{ find: jest.Mock }>;
  let orderRepo: jest.Mocked<{ find: jest.Mock }>;
  let paymentRepo: jest.Mocked<{ find: jest.Mock }>;
  let returnRepo: jest.Mocked<{ find: jest.Mock }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Supplier),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(PurchaseReturn),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(PurchaseReturnItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Currency),
          useValue: {},
        },
        {
          provide: getRepositoryToken(FxRate),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Container),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PackingList),
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
    supplierRepo = module.get(getRepositoryToken(Supplier));
    orderRepo = module.get(getRepositoryToken(PurchaseOrder));
    paymentRepo = module.get(getRepositoryToken(SupplierPayment));
    returnRepo = module.get(getRepositoryToken(PurchaseReturn));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSupplierAging', () => {
    it('should age a single supplier with one order correctly', async () => {
      supplierRepo.find.mockResolvedValue([
        { id: 1, name: 'Supplier A' } as Supplier,
      ]);
      orderRepo.find.mockResolvedValue([
        {
          supplier_id: 1,
          order_date: daysAgo(45),
          total_amount: 2000,
        } as PurchaseOrder,
      ]);
      paymentRepo.find.mockResolvedValue([]);
      returnRepo.find.mockResolvedValue([]);

      const result = await service.getSupplierAging();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Supplier A',
        total: 2000,
        current: 0,
        days1_30: 2000,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
      });
    });

    it('should handle supplier with payment credits', async () => {
      supplierRepo.find.mockResolvedValue([
        { id: 1, name: 'Supplier A' } as Supplier,
      ]);
      orderRepo.find.mockResolvedValue([
        {
          supplier_id: 1,
          order_date: daysAgo(90),
          total_amount: 1500,
        } as PurchaseOrder,
        {
          supplier_id: 1,
          order_date: daysAgo(20),
          total_amount: 1000,
        } as PurchaseOrder,
      ]);
      paymentRepo.find.mockResolvedValue([
        {
          supplier_id: 1,
          payment_date: daysAgo(50),
          amount: 800,
        } as SupplierPayment,
      ]);
      returnRepo.find.mockResolvedValue([]);

      const result = await service.getSupplierAging();

      expect(result).toHaveLength(1);
      // Order 1 (90d, 1500) partially paid: 1500-800 = 700 remaining (90 days → days31_60)
      // Order 2 (20d, 1000) untouched → current
      expect(result[0].total).toBe(1700);
      expect(result[0].current).toBe(1000);
      expect(result[0].days31_60).toBe(700);
    });
  });
});
