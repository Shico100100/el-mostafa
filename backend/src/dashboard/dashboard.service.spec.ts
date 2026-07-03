import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Account } from '../accounting/entities/account.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';
import { Machine } from '../manufacturing/entities/machine.entity';
import { Attendance } from '../manufacturing/entities/attendance.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { CacheService } from '../cache/cache.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let salesRepo: Repository<SalesOrder>;
  let purchaseRepo: Repository<PurchaseOrder>;
  let accountRepo: Repository<Account>;
  let productionRepo: Repository<DailyProduction>;
  let machineRepo: Repository<Machine>;
  let attendanceRepo: Repository<Attendance>;
  let salesItemRepo: Repository<SalesOrderItem>;

  const mockGetRawOne = jest.fn();
  const mockGetRawMany = jest.fn();
  const mockGetMany = jest.fn();
  const mockCount = jest.fn();
  const mockFindOne = jest.fn();
  const mockQuery = jest.fn();

  const createMockQB = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: mockGetRawOne,
    getRawMany: mockGetRawMany,
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: mockGetMany,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
            findOne: mockFindOne,
            query: mockQuery,
          },
        },
        {
          provide: getRepositoryToken(DailyProduction),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
          },
        },
        {
          provide: getRepositoryToken(Machine),
          useValue: {
            find: jest.fn(),
            count: mockCount,
          },
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderItem),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    salesRepo = module.get(getRepositoryToken(SalesOrder));
    purchaseRepo = module.get(getRepositoryToken(PurchaseOrder));
    accountRepo = module.get(getRepositoryToken(Account));
    productionRepo = module.get(getRepositoryToken(DailyProduction));
    machineRepo = module.get(getRepositoryToken(Machine));
    attendanceRepo = module.get(getRepositoryToken(Attendance));
    salesItemRepo = module.get(getRepositoryToken(SalesOrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    const setupMocks = (overrides?: {
      salesTotal?: number;
      purchasesTotal?: number;
      treasuryBalance?: number;
      stockValue?: number;
      productionTotal?: number;
      maintenanceCount?: number;
      topCustomers?: any[];
      topProducts?: any[];
      attendanceSummary?: any;
      salesTrend?: any[];
      latestSales?: any[];
      latestPurchases?: any[];
    }) => {
      const defaults = {
        salesTotal: 50000,
        purchasesTotal: 30000,
        treasuryBalance: 120000,
        stockValue: 75000,
        productionTotal: 1500,
        maintenanceCount: 2,
        topCustomers: [
          { name: 'Customer A', total: 15000 },
          { name: 'Customer B', total: 10000 },
        ],
        topProducts: [
          { name: 'Product X', total: 500 },
          { name: 'Product Y', total: 300 },
        ],
        attendanceSummary: { present: 20, absent: 3, late: 2, total: 25 },
        salesTrend: [
          { date: '2026-06-27', value: 5000 },
          { date: '2026-06-28', value: 7500 },
        ],
        latestSales: [
          { id: 1, total_amount: 5000, customer: { name: 'Customer A' } },
        ],
        latestPurchases: [
          { id: 1, total_amount: 3000, supplier: { name: 'Supplier X' } },
        ],
        ...overrides,
      };

      let salesQBIdx = 0;
      let purchaseQBIdx = 0;
      let productionQBIdx = 0;
      let attendanceQBIdx = 0;
      let salesItemQBIdx = 0;

      (salesRepo.createQueryBuilder as jest.Mock).mockImplementation(() => {
        salesQBIdx++;
        const qb = createMockQB();
        if (salesQBIdx === 1) {
          // Total sales query
          qb.getRawOne.mockResolvedValue({ total: defaults.salesTotal });
        } else if (salesQBIdx === 2) {
          // Top customers
          qb.getRawMany.mockResolvedValue(defaults.topCustomers);
        } else if (salesQBIdx === 3) {
          // Sales trend
          qb.getRawMany.mockResolvedValue(defaults.salesTrend);
        } else if (salesQBIdx === 4) {
          // Latest sales
          qb.getMany.mockResolvedValue(defaults.latestSales);
        }
        return qb;
      });

      (purchaseRepo.createQueryBuilder as jest.Mock).mockImplementation(() => {
        purchaseQBIdx++;
        const qb = createMockQB();
        if (purchaseQBIdx === 1) {
          qb.getRawOne.mockResolvedValue({ total: defaults.purchasesTotal });
        } else if (purchaseQBIdx === 2) {
          qb.getMany.mockResolvedValue(defaults.latestPurchases);
        }
        return qb;
      });

      (accountRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        balance: defaults.treasuryBalance,
      });

      mockQuery.mockResolvedValue([{ total_value: defaults.stockValue }]);

      (productionRepo.createQueryBuilder as jest.Mock).mockImplementation(() => {
        const qb = createMockQB();
        qb.getRawOne.mockResolvedValue({ total: defaults.productionTotal });
        return qb;
      });

      (machineRepo.count as jest.Mock).mockResolvedValue(defaults.maintenanceCount);

      (attendanceRepo.createQueryBuilder as jest.Mock).mockImplementation(() => {
        const qb = createMockQB();
        qb.getRawOne.mockResolvedValue(defaults.attendanceSummary);
        return qb;
      });

      (salesItemRepo.createQueryBuilder as jest.Mock).mockImplementation(() => {
        const qb = createMockQB();
        qb.getRawMany.mockResolvedValue(defaults.topProducts);
        return qb;
      });

      return defaults;
    };

    it('should return all expected fields', async () => {
      setupMocks();
      const result = await service.getStats();

      expect(result).toHaveProperty('totalSales');
      expect(result).toHaveProperty('totalPurchases');
      expect(result).toHaveProperty('treasuryBalance');
      expect(result).toHaveProperty('totalStockValue');
      expect(result).toHaveProperty('productionCount');
      expect(result).toHaveProperty('maintenanceOverdueCount');
      expect(result).toHaveProperty('topCustomers');
      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('attendanceSummary');
      expect(result).toHaveProperty('salesTrend');
      expect(result).toHaveProperty('latestSales');
      expect(result).toHaveProperty('latestPurchases');
    });

    it('should return correct totals', async () => {
      setupMocks({ salesTotal: 75000, purchasesTotal: 42000 });
      const result = await service.getStats();

      expect(result.totalSales).toBe(75000);
      expect(result.totalPurchases).toBe(42000);
    });

    it('should include salesTrend array', async () => {
      const trend = [
        { date: '2026-06-27', value: 5000 },
        { date: '2026-06-28', value: 7500 },
        { date: '2026-06-29', value: 0 },
      ];
      setupMocks({ salesTrend: trend });
      const result = await service.getStats();

      expect(result.salesTrend).toHaveLength(3);
      expect(result.salesTrend[0]).toEqual({ date: '2026-06-27', value: 5000 });
    });

    it('should include topCustomers', async () => {
      setupMocks();
      const result = await service.getStats();

      expect(result.topCustomers).toHaveLength(2);
      expect(result.topCustomers[0].name).toBe('Customer A');
      expect(result.topCustomers[0].total).toBe(15000);
    });

    it('should include topProducts', async () => {
      setupMocks();
      const result = await service.getStats();

      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0].name).toBe('Product X');
      expect(result.topProducts[0].total).toBe(500);
    });

    it('should return treasuryBalance from account', async () => {
      setupMocks({ treasuryBalance: 250000 });
      const result = await service.getStats();

      expect(result.treasuryBalance).toBe(250000);
    });

    it('should return maintenanceOverdueCount', async () => {
      setupMocks({ maintenanceCount: 5 });
      const result = await service.getStats();

      expect(result.maintenanceOverdueCount).toBe(5);
    });

    it('should return attendanceSummary with correct fields', async () => {
      setupMocks();
      const result = await service.getStats();

      expect(result.attendanceSummary).toEqual({
        present: 20,
        absent: 3,
        late: 2,
        total: 25,
      });
    });

    it('should handle empty salesTrend gracefully', async () => {
      setupMocks({ salesTrend: [] });
      const result = await service.getStats();

      expect(result.salesTrend).toEqual([]);
    });

    it('should default totals to 0 when query returns null', async () => {
      setupMocks({ salesTotal: 0, purchasesTotal: 0 });
      const result = await service.getStats();

      expect(result.totalSales).toBe(0);
      expect(result.totalPurchases).toBe(0);
    });
  });
});
