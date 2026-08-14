import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Warehouse } from './entities/warehouse.entity';

describe('StockService', () => {
  let service: StockService;
  let stockRepo: Repository<Stock>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            manager: { connection: { createQueryRunner: jest.fn() } },
          },
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    stockRepo = module.get(getRepositoryToken(Stock));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addStockMovement - IN', () => {
    it('should increase stock quantity for IN movements', async () => {
      const existingStock = {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        quantity: 50,
      };
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(existingStock),
      };

      await service.addStockMovement(
        {
          product_id: 1,
          warehouse_id: 1,
          type: MovementType.IN,
          quantity: 30,
          notes: 'test',
        },
        mockManager as any,
      );

      expect(mockManager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          product_id: 1,
          warehouse_id: 1,
          type: MovementType.IN,
          quantity: 30,
        }),
      );
      const stockSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockSaveCall).toBeDefined();
      expect(stockSaveCall[1].quantity).toBe(80);
    });
  });

  describe('addStockMovement - OUT', () => {
    it('should decrease stock quantity for OUT movements', async () => {
      const existingStock = {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        quantity: 100,
      };
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(existingStock),
      };

      await service.addStockMovement(
        {
          product_id: 1,
          warehouse_id: 1,
          type: MovementType.OUT,
          quantity: 40,
        },
        mockManager as any,
      );

      const stockSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockSaveCall).toBeDefined();
      expect(stockSaveCall[1].quantity).toBe(60);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      const existingStock = {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        quantity: 10,
      };
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(existingStock),
      };

      await expect(
        service.addStockMovement(
          {
            product_id: 1,
            warehouse_id: 1,
            type: MovementType.OUT,
            quantity: 50,
          },
          mockManager as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip stock check when skipStockCheck is true', async () => {
      const existingStock = {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        quantity: 5,
      };
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(existingStock),
      };

      await expect(
        service.addStockMovement(
          {
            product_id: 1,
            warehouse_id: 1,
            type: MovementType.OUT,
            quantity: 50,
          },
          mockManager as any,
          true,
        ),
      ).resolves.toBeDefined();

      const stockSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockSaveCall[1].quantity).toBe(-45);
    });
  });

  describe('addStockMovement - ADJUST', () => {
    it('should set stock quantity to exact value for ADJUST', async () => {
      const existingStock = {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        quantity: 500,
      };
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(existingStock),
      };

      await service.addStockMovement(
        {
          product_id: 1,
          warehouse_id: 1,
          type: MovementType.ADJUST,
          quantity: 250,
        },
        mockManager as any,
      );

      const stockSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockSaveCall[1].quantity).toBe(250);
    });
  });

  describe('addStockMovement - new stock record', () => {
    it('should create new stock record when none exists', async () => {
      const mockManager = {
        create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      };

      await service.addStockMovement(
        {
          product_id: 5,
          warehouse_id: 1,
          type: MovementType.IN,
          quantity: 100,
        },
        mockManager as any,
      );

      const stockCreateCall = mockManager.create.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockCreateCall).toBeDefined();
      expect(stockCreateCall[1].quantity).toBe(0);

      const stockSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Stock,
      );
      expect(stockSaveCall[1].quantity).toBe(100);
    });
  });

  describe('getStock', () => {
    it('should return filtered stock', async () => {
      const mockStock = [
        { id: 1, product_id: 1, warehouse_id: 1, quantity: 50 },
      ];
      (stockRepo.find as jest.Mock).mockResolvedValue(mockStock);

      const result = await service.getStock(1, 1);
      expect(result).toEqual(mockStock);
      expect(stockRepo.find).toHaveBeenCalledWith({
        where: { product_id: 1, warehouse_id: 1 },
        relations: ['product', 'warehouse'],
      });
    });

    it('should return all stock when no filters', async () => {
      const mockStock = [
        { id: 1, product_id: 1, warehouse_id: 1, quantity: 50 },
        { id: 2, product_id: 2, warehouse_id: 1, quantity: 100 },
      ];
      (stockRepo.find as jest.Mock).mockResolvedValue(mockStock);

      const result = await service.getStock();
      expect(result).toEqual(mockStock);
      expect(stockRepo.find).toHaveBeenCalledWith({
        where: {},
        relations: ['product', 'warehouse'],
      });
    });
  });
});
