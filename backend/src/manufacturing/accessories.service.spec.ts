import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccessoriesService } from './accessories.service';
import { WarehouseHelper } from './warehouse.helper';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';

describe('AccessoriesService', () => {
  let service: AccessoriesService;
  let productRepo: Repository<Product>;
  let stockRepo: Repository<Stock>;
  let stockMovementRepo: Repository<StockMovement>;
  let warehouseHelper: WarehouseHelper;
  let dataSource: DataSource;

  const mockQuery = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessoriesService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
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
          },
        },
        {
          provide: WarehouseHelper,
          useValue: {
            getDefaultWarehouseId: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: mockQuery,
          },
        },
      ],
    }).compile();

    service = module.get<AccessoriesService>(AccessoriesService);
    productRepo = module.get(getRepositoryToken(Product));
    stockRepo = module.get(getRepositoryToken(Stock));
    stockMovementRepo = module.get(getRepositoryToken(StockMovement));
    warehouseHelper = module.get(WarehouseHelper);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return products with type ACCESSORY and stock levels', async () => {
      mockQuery.mockReset();
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 10,
            name: 'Zipper',
            sku: 'ACC-001',
            barcode: '456',
            cost_price: 2.5,
            selling_price: 5,
            unit: 'piece',
            type: 'ACCESSORY',
            description: 'Metal zipper',
            min_stock: 100,
            weight_grams: 5,
            image_path: null,
            reorder_point: 200,
            reorder_quantity: 500,
            avg_consumption_rate: 10,
            last_purchase_price: 2.5,
            last_purchase_date: '2026-03-01',
            weight_per_piece: 5,
            preferred_supplier_id: 20,
            notes: 'Silver',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            current_stock: 300,
          },
        ])
        .mockResolvedValueOnce([{ id: 20, name: 'Supplier B' }]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].product.name).toBe('Zipper');
      expect(result[0].current_stock).toBe(300);
      expect(result[0].stock_status).toBe('NORMAL');
      expect(result[0].preferred_supplier).toEqual({ id: 20, name: 'Supplier B' });
    });

    it('should mark accessories with zero stock as OUT_OF_STOCK', async () => {
      mockQuery.mockReset();
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 11, name: 'Button', sku: null, barcode: null, cost_price: 0.5, selling_price: 1, unit: 'piece', type: 'ACCESSORY', description: null, min_stock: null, weight_grams: null, image_path: null, reorder_point: 50, reorder_quantity: 100, avg_consumption_rate: 0, last_purchase_price: 0.5, last_purchase_date: null, weight_per_piece: null, preferred_supplier_id: null, notes: null, is_active: true, created_at: new Date(), updated_at: new Date(), current_stock: 0,
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.findAll();
      expect(result[0].stock_status).toBe('OUT_OF_STOCK');
    });

    it('should return empty array when no accessories exist', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single accessory', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10,
        type: 'ACCESSORY',
        name: 'Zipper',
        preferred_supplier: { id: 20, name: 'Supplier B' },
        reorder_point: 200,
        last_purchase_price: 2.5,
        weight_per_piece: 5,
        image_path: null,
        notes: 'Silver',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 10, quantity: 300 });

      const result = await service.findOne(10);

      expect(result.product.name).toBe('Zipper');
      expect(result.current_stock).toBe(300);
      expect(result.preferred_supplier).toEqual({ id: 20, name: 'Supplier B' });
    });

    it('should throw NotFoundException when accessory not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return 0 current stock when no stock record exists', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Button', preferred_supplier: null,
        reorder_point: 50, last_purchase_price: 0.5, weight_per_piece: 1, image_path: null, notes: null,
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(10);
      expect(result.current_stock).toBe(0);
    });
  });

  describe('getTotalValue', () => {
    it('should return correct total value', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([{ count: 3, total_value: 1500.75 }]);

      const result = await service.getTotalValue();
      expect(result.total_value).toBe(1500.75);
      expect(result.count).toBe(3);
    });

    it('should return 0 when no accessories exist', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([{ count: 0, total_value: 0 }]);
      const result = await service.getTotalValue();
      expect(result.total_value).toBe(0);
      expect(result.count).toBe(0);
    });

    it('should handle null query result gracefully', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([{}]);
      const result = await service.getTotalValue();
      expect(result.total_value).toBe(0);
      expect(result.count).toBe(0);
    });
  });

  describe('addStock', () => {
    it('should increase stock', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Zipper',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 10, warehouse_id: 1, quantity: 50 });
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockMovementRepo.save as jest.Mock).mockImplementation((d) => ({ id: 1, ...d }));

      const result = await service.addStock(10, 25);

      const savedStock = (stockRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedStock.quantity).toBe(75);
    });

    it('should update price when provided', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Button',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 10, warehouse_id: 1, quantity: 10 });
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockMovementRepo.save as jest.Mock).mockResolvedValue({});

      await service.addStock(10, 5, 3.5);

      expect(productRepo.update).toHaveBeenCalledWith(10, {
        last_purchase_price: 3.5,
        cost_price: 3.5,
      });
    });

    it('should throw BadRequestException when quantity is zero', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 10, type: 'ACCESSORY', name: 'Zipper' });
      await expect(service.addStock(10, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity is negative', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 10, type: 'ACCESSORY', name: 'Zipper' });
      await expect(service.addStock(10, -5)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when accessory not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.addStock(999, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('consumeStock', () => {
    it('should decrease stock', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Zipper',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 10, warehouse_id: 1, quantity: 100 });
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockMovementRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.consumeStock(10, 30);

      const savedStock = (stockRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedStock.quantity).toBe(70);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Zipper',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 10, warehouse_id: 1, quantity: 10 });

      await expect(service.consumeStock(10, 50)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when stock record does not exist', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10, type: 'ACCESSORY', name: 'Zipper',
      });
      (stockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.consumeStock(10, 5)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity is zero', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 10, type: 'ACCESSORY', name: 'Button' });
      await expect(service.consumeStock(10, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when accessory not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.consumeStock(999, 5)).rejects.toThrow(NotFoundException);
    });
  });
});
