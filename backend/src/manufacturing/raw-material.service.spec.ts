import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RawMaterialService } from './raw-material.service';
import { WarehouseHelper } from './warehouse.helper';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement, MovementType } from '../inventory/entities/stock-movement.entity';
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';

describe('RawMaterialService', () => {
  let service: RawMaterialService;
  let productRepo: Repository<Product>;
  let consumptionRepo: Repository<RawMaterialConsumption>;
  let supplierMaterialRepo: Repository<SupplierMaterial>;
  let stockRepo: Repository<Stock>;
  let stockMovementRepo: Repository<StockMovement>;
  let warehouseHelper: WarehouseHelper;
  let dataSource: DataSource;

  const mockQuery = jest.fn();
  const mockGetRawOne = jest.fn();
  const mockGetRawMany = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RawMaterialService,
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
          provide: getRepositoryToken(RawMaterialConsumption),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SupplierMaterial),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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
            delete: jest.fn(),
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
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawOne: mockGetRawOne,
              getRawMany: mockGetRawMany,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RawMaterialService>(RawMaterialService);
    productRepo = module.get(getRepositoryToken(Product));
    consumptionRepo = module.get(getRepositoryToken(RawMaterialConsumption));
    supplierMaterialRepo = module.get(getRepositoryToken(SupplierMaterial));
    stockRepo = module.get(getRepositoryToken(Stock));
    stockMovementRepo = module.get(getRepositoryToken(StockMovement));
    warehouseHelper = module.get(WarehouseHelper);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRawMaterials', () => {
    it('should return products with type RAW and their stock levels', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            id: 1,
            product_id: 1,
            product_name: 'Plastic Granules',
            preferred_supplier_id: 10,
            reorder_point: 50,
            reorder_quantity: 100,
            avg_consumption_rate: 5,
            last_purchase_price: 12.5,
            last_purchase_date: '2026-01-15',
            notes: 'High grade',
            created_at: new Date(),
            updated_at: new Date(),
            sku: 'RM-001',
            barcode: '123',
            cost_price: 12,
            selling_price: 0,
            unit: 'kg',
            type: 'RAW',
            description: 'Plastic',
            min_stock: 20,
            weight_grams: 1000,
            image_path: null,
            raw_material_type: 'plastic',
            weight_per_piece: null,
            is_active: true,
            current_stock: 75,
            warehouse_id: 1,
          },
          {
            id: 1,
            product_id: 1,
            product_name: 'Plastic Granules',
            preferred_supplier_id: 10,
            reorder_point: 50,
            reorder_quantity: 100,
            avg_consumption_rate: 5,
            last_purchase_price: 12.5,
            last_purchase_date: '2026-01-15',
            notes: 'High grade',
            created_at: new Date(),
            updated_at: new Date(),
            sku: 'RM-001',
            barcode: '123',
            cost_price: 12,
            selling_price: 0,
            unit: 'kg',
            type: 'RAW',
            description: 'Plastic',
            min_stock: 20,
            weight_grams: 1000,
            image_path: null,
            raw_material_type: 'plastic',
            weight_per_piece: null,
            is_active: true,
            current_stock: 25,
            warehouse_id: 2,
          },
        ])
        .mockResolvedValueOnce([{ id: 10, name: 'Supplier A' }]);

      const result = await service.getRawMaterials();

      expect(result).toHaveLength(1);
      expect(result[0].product_name).toBe('Plastic Granules');
      expect(result[0].current_stock).toBe(100);
      expect(result[0].preferred_supplier).toEqual({ id: 10, name: 'Supplier A' });
    });

    it('should aggregate stock across multiple warehouses', async () => {
      mockQuery
        .mockResolvedValueOnce([
          { id: 1, product_id: 1, product_name: 'Resin', preferred_supplier_id: null, reorder_point: 10, reorder_quantity: 20, avg_consumption_rate: 1, last_purchase_price: 5, last_purchase_date: null, notes: null, created_at: new Date(), updated_at: new Date(), sku: null, barcode: null, cost_price: 5, selling_price: 0, unit: 'kg', type: 'RAW', description: null, min_stock: null, weight_grams: null, image_path: null, raw_material_type: null, weight_per_piece: null, is_active: true, current_stock: 30, warehouse_id: 1 },
          { id: 1, product_id: 1, product_name: 'Resin', preferred_supplier_id: null, reorder_point: 10, reorder_quantity: 20, avg_consumption_rate: 1, last_purchase_price: 5, last_purchase_date: null, notes: null, created_at: new Date(), updated_at: new Date(), sku: null, barcode: null, cost_price: 5, selling_price: 0, unit: 'kg', type: 'RAW', description: null, min_stock: null, weight_grams: null, image_path: null, raw_material_type: null, weight_per_piece: null, is_active: true, current_stock: 20, warehouse_id: 2 },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getRawMaterials();
      expect(result[0].current_stock).toBe(50);
    });

    it('should return empty array when no raw materials exist', async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const result = await service.getRawMaterials();
      expect(result).toEqual([]);
    });
  });

  describe('getRawMaterial', () => {
    it('should return a single raw material with supplier info', async () => {
      const product = {
        id: 1,
        type: 'RAW',
        name: 'Plastic Granules',
        preferred_supplier_id: 10,
        preferred_supplier: { id: 10, name: 'Supplier A' },
        reorder_point: 50,
      };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (supplierMaterialRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, supplier_id: 10, product_id: 1, price: 12.5, supplier: { id: 10, name: 'Supplier A' } },
      ]);
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 1, quantity: 75 });

      const result = await service.getRawMaterial(1) as any;

      expect(result.product.name).toBe('Plastic Granules');
      expect(result.current_stock).toBe(75);
      expect(result.preferred_supplier).toEqual({ id: 10, name: 'Supplier A' });
      expect(result.supplier_materials).toHaveLength(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getRawMaterial(999)).rejects.toThrow(NotFoundException);
    });

    it('should return 0 current stock when no stock record exists', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, type: 'RAW', name: 'Resin', preferred_supplier_id: null, preferred_supplier: null });
      (supplierMaterialRepo.find as jest.Mock).mockResolvedValue([]);
      (stockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getRawMaterial(1) as any;
      expect(result.current_stock).toBe(0);
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return only materials below reorder point', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([
        {
          id: 1,
          product_id: 1,
          product_name: 'Low Material',
          preferred_supplier_id: null,
          reorder_point: 50,
          reorder_quantity: 100,
          avg_consumption_rate: 5,
          last_purchase_price: 10,
          last_purchase_date: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          current_stock: 20,
        },
      ]);

      const result = await service.getLowStockAlerts();
      expect(result).toHaveLength(1);
      expect(result[0].current_stock).toBe(20);
      expect(result[0].stock_status).toBe('LOW_STOCK');
    });

    it('should mark materials with zero stock as OUT_OF_STOCK', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([
        {
          id: 2,
          product_id: 2,
          product_name: 'Empty Material',
          preferred_supplier_id: null,
          reorder_point: 10,
          reorder_quantity: 20,
          avg_consumption_rate: 0,
          last_purchase_price: 5,
          last_purchase_date: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          current_stock: 0,
        },
      ]);

      const result = await service.getLowStockAlerts();
      expect(result[0].stock_status).toBe('OUT_OF_STOCK');
    });

    it('should return empty array when all materials are above reorder point', async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValue([]);
      const result = await service.getLowStockAlerts();
      expect(result).toEqual([]);
    });
  });

  describe('recordConsumption', () => {
    it('should deduct stock and create a consumption record', async () => {
      const product = { id: 1, type: 'RAW', name: 'Plastic', last_purchase_price: 10, cost_price: 8 };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 1, quantity: 100, warehouse_id: 1 });
      (consumptionRepo.create as jest.Mock).mockImplementation((d) => d);
      (consumptionRepo.save as jest.Mock).mockImplementation((d) => ({ id: 1, ...d }));
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.recordConsumption({
        product_id: 1,
        quantity: 15,
        production_id: 5,
      });

      expect(result.quantity).toBe(15);
      expect(result.cost_per_unit).toBe(10);
      expect(result.total_cost).toBe(150);
      expect(stockRepo.save).toHaveBeenCalled();
      const savedStock = (stockRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedStock.quantity).toBe(85);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      const product = { id: 1, type: 'RAW', name: 'Plastic', last_purchase_price: 10, cost_price: 8 };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 1, quantity: 5, warehouse_id: 1 });

      await expect(
        service.recordConsumption({ product_id: 1, quantity: 20 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use cost_price when last_purchase_price is not set', async () => {
      const product = { id: 1, type: 'RAW', name: 'Resin', last_purchase_price: null, cost_price: 8 };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 1, quantity: 50, warehouse_id: 1 });
      (consumptionRepo.create as jest.Mock).mockImplementation((d) => d);
      (consumptionRepo.save as jest.Mock).mockImplementation((d) => ({ id: 1, ...d }));
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.recordConsumption({ product_id: 1, quantity: 10 });
      expect(result.cost_per_unit).toBe(8);
      expect(result.total_cost).toBe(80);
    });
  });

  describe('addRawMaterialStock', () => {
    it('should increase stock and create a movement', async () => {
      const product = { id: 1, type: 'RAW', name: 'Plastic' };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (productRepo.update as jest.Mock).mockResolvedValue({});
      (stockRepo.findOne as jest.Mock).mockResolvedValue({ product_id: 1, quantity: 50, warehouse_id: 1 });
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockMovementRepo.save as jest.Mock).mockImplementation((d) => ({ id: 1, ...d }));

      const result = await service.addRawMaterialStock({
        product_id: 1,
        quantity: 30,
        price: 12.5,
        date: new Date(),
      });

      expect(result.type).toBe(MovementType.IN);
      expect(result.quantity).toBe(30);
      const savedStock = (stockRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedStock.quantity).toBe(80);
      expect(productRepo.update).toHaveBeenCalledWith(1, {
        last_purchase_price: 12.5,
        cost_price: 12.5,
      });
    });

    it('should create new stock record if none exists', async () => {
      const product = { id: 1, type: 'RAW', name: 'Resin' };
      (productRepo.findOne as jest.Mock).mockResolvedValue(product);
      (productRepo.update as jest.Mock).mockResolvedValue({});
      (stockRepo.findOne as jest.Mock).mockResolvedValue(null);
      (stockRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockRepo.save as jest.Mock).mockResolvedValue({});
      (stockMovementRepo.create as jest.Mock).mockImplementation((d) => d);
      (stockMovementRepo.save as jest.Mock).mockImplementation((d) => ({ id: 1, ...d }));

      await service.addRawMaterialStock({
        product_id: 1,
        quantity: 20,
        date: new Date(),
      });

      expect(stockRepo.create).toHaveBeenCalled();
      const createdStock = (stockRepo.create as jest.Mock).mock.calls[0][0];
      expect(createdStock.quantity).toBe(20);
    });

    it('should throw NotFoundException when raw material not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.addRawMaterialStock({ product_id: 999, quantity: 10, date: new Date() }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
