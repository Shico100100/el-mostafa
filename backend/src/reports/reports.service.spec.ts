import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReportsService } from './reports.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Account } from '../accounting/entities/account.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { FixedCost } from '../manufacturing/entities/fixed-cost.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let accountRepo: jest.Mocked<Repository<Account>>;
  let salesOrderRepo: jest.Mocked<Repository<SalesOrder>>;
  let purchaseOrderRepo: jest.Mocked<Repository<PurchaseOrder>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: jest.fn(),
          },
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
          provide: getRepositoryToken(FixedCost),
          useValue: {},
        },
        {
          provide: getRepositoryToken(DailyProduction),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        ReportsService,
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    accountRepo = module.get(getRepositoryToken(Account));
    salesOrderRepo = module.get(getRepositoryToken(SalesOrder));
    purchaseOrderRepo = module.get(getRepositoryToken(PurchaseOrder));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashFlowProjection', () => {
    function midnightToday(): Date {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }

    it('should return cash flow projection with default 30 days', async () => {
      accountRepo.findOne.mockResolvedValue({
        code: '1103',
        balance: 10000,
      } as Account);
      salesOrderRepo.find.mockResolvedValue([
        {
          total_amount: 5000,
          order_date: midnightToday(),
        } as SalesOrder,
        {
          total_amount: 3000,
          order_date: midnightToday(),
        } as SalesOrder,
      ]);
      purchaseOrderRepo.find.mockResolvedValue([
        {
          total_amount: 4000,
          order_date: midnightToday(),
        } as PurchaseOrder,
      ]);

      const result = await service.getCashFlowProjection();

      expect(result.startingCash).toBe(10000);
      expect(result.expectedInflows).toBe(8000);
      expect(result.expectedOutflows).toBe(4000);
      expect(result.netCashFlow).toBe(4000);
      expect(result.projectedBalance).toBe(14000);
      expect(result.dailyProjection.length).toBe(31);
      expect(result.dailyProjection[0].balance).toBe(14000);
    });

    it('should return cash flow projection with custom days parameter', async () => {
      accountRepo.findOne.mockResolvedValue({
        code: '1103',
        balance: 5000,
      } as Account);
      salesOrderRepo.find.mockResolvedValue([
        {
          total_amount: 2000,
          order_date: midnightToday(),
        } as SalesOrder,
      ]);
      purchaseOrderRepo.find.mockResolvedValue([]);

      const result = await service.getCashFlowProjection(7);

      expect(result.startingCash).toBe(5000);
      expect(result.expectedInflows).toBe(2000);
      expect(result.expectedOutflows).toBe(0);
      expect(result.netCashFlow).toBe(2000);
      expect(result.projectedBalance).toBe(7000);
      expect(result.dailyProjection.length).toBe(8);
    });

    it('should handle empty order data gracefully', async () => {
      accountRepo.findOne.mockResolvedValue({
        code: '1103',
        balance: 10000,
      } as Account);
      salesOrderRepo.find.mockResolvedValue([]);
      purchaseOrderRepo.find.mockResolvedValue([]);

      const result = await service.getCashFlowProjection();

      expect(result.startingCash).toBe(10000);
      expect(result.expectedInflows).toBe(0);
      expect(result.expectedOutflows).toBe(0);
      expect(result.netCashFlow).toBe(0);
      expect(result.projectedBalance).toBe(10000);
      expect(result.dailyProjection.every((d) => d.balance === 10000)).toBe(
        true,
      );
    });

    it('should handle zero treasury balance', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      salesOrderRepo.find.mockResolvedValue([
        {
          total_amount: 5000,
          order_date: midnightToday(),
        } as SalesOrder,
      ]);
      purchaseOrderRepo.find.mockResolvedValue([
        {
          total_amount: 3000,
          order_date: midnightToday(),
        } as PurchaseOrder,
      ]);

      const result = await service.getCashFlowProjection();

      expect(result.startingCash).toBe(0);
      expect(result.expectedInflows).toBe(5000);
      expect(result.expectedOutflows).toBe(3000);
      expect(result.netCashFlow).toBe(2000);
      expect(result.projectedBalance).toBe(2000);
    });
  });
});
