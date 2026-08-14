import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedCostService } from './fixed-cost.service';
import { FixedCost } from './entities/fixed-cost.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { Machine } from './entities/machine.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { AccountingService } from '../accounting/accounting.service';

describe('FixedCostService', () => {
  let service: FixedCostService;
  let fixedCostRepo: Repository<FixedCost>;
  let productionRepo: Repository<DailyProduction>;
  let purchaseOrderItemRepo: Repository<PurchaseOrderItem>;

  const mockGetRawOne = jest.fn();
  const mockGetMany = jest.fn();

  const createMockQB = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: mockGetRawOne,
    getMany: mockGetMany,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedCostService,
        {
          provide: getRepositoryToken(FixedCost),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => createMockQB()),
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
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: AccountingService,
          useValue: {
            postAutomaticEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FixedCostService>(FixedCostService);
    fixedCostRepo = module.get(getRepositoryToken(FixedCost));
    productionRepo = module.get(getRepositoryToken(DailyProduction));
    purchaseOrderItemRepo = module.get(getRepositoryToken(PurchaseOrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePieceCost', () => {
    it('should calculate piece cost as raw cost + fixed cost', () => {
      const result = service.calculatePieceCost({
        rawMaterialPrice: 10000,
        pieceWeight: 50,
        hourlyCost: 200,
        hoursWorked: 8,
        totalPieces: 1000,
      });

      const rawCost = (10000 / 1000) * 50;
      const fixedCost = (200 * 8) / 1000;
      expect(result).toBe(rawCost + fixedCost);
    });

    it('should handle zero total pieces without division by zero', () => {
      const result = service.calculatePieceCost({
        rawMaterialPrice: 10000,
        pieceWeight: 50,
        hourlyCost: 200,
        hoursWorked: 8,
        totalPieces: 0,
      });

      expect(result).toBe(500);
    });

    it('should handle zero hourly cost', () => {
      const result = service.calculatePieceCost({
        rawMaterialPrice: 10000,
        pieceWeight: 100,
        hourlyCost: 0,
        hoursWorked: 8,
        totalPieces: 500,
      });

      expect(result).toBe(1000);
    });

    it('should calculate correctly with fractional values', () => {
      const result = service.calculatePieceCost({
        rawMaterialPrice: 33333.33,
        pieceWeight: 123.456,
        hourlyCost: 150.75,
        hoursWorked: 8,
        totalPieces: 250,
      });

      const rawCost = (33333.33 / 1000) * 123.456;
      const fixedCost = (150.75 * 8) / 250;
      const expected = Math.round((rawCost + fixedCost) * 10000) / 10000;
      expect(result).toBeCloseTo(expected, 4);
    });
  });

  describe('getPreviousMonthStrings', () => {
    it('should return correct previous month strings', () => {
      const result = service.getPreviousMonthStrings('2026-07', 3);
      expect(result).toEqual(['2026-06', '2026-05', '2026-04']);
    });

    it('should handle year boundaries', () => {
      const result = service.getPreviousMonthStrings('2026-01', 3);
      expect(result).toEqual(['2025-12', '2025-11', '2025-10']);
    });

    it('should return single month when count is 1', () => {
      const result = service.getPreviousMonthStrings('2026-07', 1);
      expect(result).toEqual(['2026-06']);
    });
  });

  describe('calculateOverheadRate', () => {
    it('should return 0 when no costs exist', async () => {
      (fixedCostRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.calculateOverheadRate('2026-07');
      expect(result).toBe(0);
    });

    it('should return 0 when no production exists', async () => {
      (fixedCostRepo.find as jest.Mock).mockResolvedValue([{ amount: 10000 }]);
      (productionRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.calculateOverheadRate('2026-07');
      expect(result).toBe(0);
    });

    it('should calculate overhead rate as total cost / total weight', async () => {
      (fixedCostRepo.find as jest.Mock).mockResolvedValue([
        { amount: 5000 },
        { amount: 3000 },
      ]);
      (productionRepo.find as jest.Mock).mockResolvedValue([
        { total_production_kg: 1000 },
        { total_production_kg: 500 },
      ]);

      const result = await service.calculateOverheadRate('2026-07');
      expect(result).toBe(8000 / 1500);
    });
  });

  describe('getLastPurchasePrice', () => {
    it('should return price when item exists', async () => {
      (purchaseOrderItemRepo.findOne as jest.Mock).mockResolvedValue({
        price: 25.5,
      });
      const result = await service.getLastPurchasePrice(1);
      expect(result).toBe(25.5);
    });

    it('should return 0 when no item exists', async () => {
      (purchaseOrderItemRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.getLastPurchasePrice(1);
      expect(result).toBe(0);
    });
  });

  describe('getFixedCosts', () => {
    it('should return paginated results', async () => {
      const items = [{ id: 1, amount: 5000 }];
      (fixedCostRepo.findAndCount as jest.Mock).mockResolvedValue([items, 1]);

      const result = await service.getFixedCosts('2026-07', undefined, 1, 50);
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      (fixedCostRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
      const result = await service.getFixedCosts(undefined, undefined, 2, 10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });
});
