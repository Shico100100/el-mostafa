import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { InventoryService } from './inventory.service';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    whereInIds: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            manager: {
              create: jest.fn(),
              save: jest.fn(),
              findOne: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    categoryRepo = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [{ id: 1, name: 'Raw' }];
      (categoryRepo.find as jest.Mock).mockResolvedValue(categories);
      const result = await service.getAllCategories();
      expect(result).toEqual(categories);
    });
  });

  describe('createProduct', () => {
    it('should create and save a product', async () => {
      const productData = { name: 'Test Product', sku: 'SKU1' };
      (productRepo.create as jest.Mock).mockReturnValue(productData);
      (productRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        ...productData,
      });

      const result = await service.createProduct(productData);
      expect(result).toHaveProperty('id', 1);
      expect(productRepo.save).toHaveBeenCalled();
    });
  });

  describe('addStockMovement', () => {
    it('should add movement and update stock for IN type', async () => {
      const movementData = {
        product_id: 1,
        warehouse_id: 1,
        type: MovementType.IN,
        quantity: 10,
      };

      const mockManager = {
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest.fn().mockImplementation((entity, data) => data),
        findOne: jest
          .fn()
          .mockResolvedValue({ product_id: 1, warehouse_id: 1, quantity: 5 }),
      } as unknown as EntityManager;

      const result = await service.addStockMovement(movementData, mockManager);

      expect(result.product_id).toBe(1);
      expect(mockManager.save).toHaveBeenCalledTimes(2); // One for movement, one for stock

      const savedStock = (mockManager.save as jest.Mock).mock.calls[1][1];
      expect(savedStock.quantity).toBe(15); // 5 + 10
    });

    it('should subtract from stock for OUT type', async () => {
      const movementData = {
        product_id: 1,
        warehouse_id: 1,
        type: MovementType.OUT,
        quantity: 3,
      };

      const mockManager = {
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest.fn().mockImplementation((entity, data) => data),
        findOne: jest
          .fn()
          .mockResolvedValue({ product_id: 1, warehouse_id: 1, quantity: 10 }),
      } as unknown as EntityManager;

      await service.addStockMovement(movementData, mockManager);

      const savedStock = (mockManager.save as jest.Mock).mock.calls[1][1];
      expect(savedStock.quantity).toBe(7); // 10 - 3
    });
  });

  describe('getAllProducts', () => {
    it('should return products with stock enrichment', async () => {
      const products = [
        { id: 1, name: 'P1' },
        { id: 2, name: 'P2' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(products);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { product_id: 1, total: 100 },
        { product_id: 2, total: 50 },
      ]);

      const result = await service.getAllProducts({});

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('stock_quantity', 100);
      expect(result[1]).toHaveProperty('stock_quantity', 50);
    });
  });
});
