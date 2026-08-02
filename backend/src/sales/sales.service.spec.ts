import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SalesService } from './sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { CacheService } from '../cache/cache.service';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('SalesService', () => {
  let service: SalesService;
  let customerRepo: jest.Mocked<{ find: jest.Mock }>;
  let orderRepo: jest.Mocked<{ find: jest.Mock }>;
  let paymentRepo: jest.Mocked<{ find: jest.Mock }>;
  let returnRepo: jest.Mocked<{ find: jest.Mock }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Customer),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(SalesOrderItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CustomerPayment),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(SalesReturn),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(SalesReturnItem),
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
          provide: CacheService,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        SalesService,
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    customerRepo = module.get(getRepositoryToken(Customer));
    orderRepo = module.get(getRepositoryToken(SalesOrder));
    paymentRepo = module.get(getRepositoryToken(CustomerPayment));
    returnRepo = module.get(getRepositoryToken(SalesReturn));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomerAging', () => {
    it('should age a single customer with one order correctly', async () => {
      customerRepo.find.mockResolvedValue([
        { id: 1, name: 'Customer A' } as Customer,
      ]);
      orderRepo.find.mockResolvedValue([
        {
          customer_id: 1,
          order_date: daysAgo(45),
          total_amount: 1000,
        } as SalesOrder,
      ]);
      paymentRepo.find.mockResolvedValue([]);
      returnRepo.find.mockResolvedValue([]);

      const result = await service.getCustomerAging();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Customer A',
        total: 1000,
        current: 0,
        days1_30: 1000,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
      });
    });

    it('should handle FIFO credit application (payment reduces oldest order first)', async () => {
      customerRepo.find.mockResolvedValue([
        { id: 1, name: 'Customer A' } as Customer,
      ]);
      orderRepo.find.mockResolvedValue([
        {
          customer_id: 1,
          order_date: daysAgo(90),
          total_amount: 1000,
        } as SalesOrder,
        {
          customer_id: 1,
          order_date: daysAgo(30),
          total_amount: 500,
        } as SalesOrder,
      ]);
      paymentRepo.find.mockResolvedValue([
        {
          customer_id: 1,
          payment_date: daysAgo(60),
          amount: 1200,
        } as CustomerPayment,
      ]);
      returnRepo.find.mockResolvedValue([]);

      const result = await service.getCustomerAging();

      expect(result).toHaveLength(1);
      // Order 1 (90d, 1000) fully consumed by 1200 payment → remaining 0
      // Order 2 (30d, 500) gets the remaining 200 credit → remaining 300
      expect(result[0].total).toBe(300);
      expect(result[0].current).toBe(300);
      expect(result[0].days1_30).toBe(0);
      expect(result[0].over90).toBe(0);
    });

    it('should handle multiple customers with mixed data', async () => {
      customerRepo.find.mockResolvedValue([
        { id: 1, name: 'Customer A' } as Customer,
        { id: 2, name: 'Customer B' } as Customer,
      ]);
      orderRepo.find.mockResolvedValue([
        {
          customer_id: 1,
          order_date: daysAgo(100),
          total_amount: 2000,
        } as SalesOrder,
        {
          customer_id: 2,
          order_date: daysAgo(10),
          total_amount: 500,
        } as SalesOrder,
      ]);
      paymentRepo.find.mockResolvedValue([]);
      returnRepo.find.mockResolvedValue([]);

      const result = await service.getCustomerAging();

      expect(result).toHaveLength(2);

      const custA = result.find((c) => c.id === 1);
      expect(custA).toBeDefined();
      expect(custA!.total).toBe(2000);
      // 100 days → 61-90 bucket
      expect(custA!.days61_90).toBe(2000);

      const custB = result.find((c) => c.id === 2);
      expect(custB).toBeDefined();
      expect(custB!.total).toBe(500);
      // 10 days → current
      expect(custB!.current).toBe(500);
    });
  });
});
