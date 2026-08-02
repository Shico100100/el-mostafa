import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { WarehouseService } from './warehouse.service';
import { StockService } from './stock.service';
import { TransactionHelper } from '../common/transaction.helper';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let categoryService: CategoryService;
  let productService: ProductService;
  let warehouseService: WarehouseService;
  let stockService: StockService;
  let transactionHelper: TransactionHelper;
  let productRepo: Repository<Product>;
  let stockRepo: Repository<Stock>;
  let warehouseRepo: Repository<Warehouse>;
  let dataSource: DataSource;

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

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockImplementation((entity, data) => data),
      save: jest.fn().mockImplementation((entity, data) => ({ id: 1, ...data })),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: TransactionHelper,
          useValue: {
            runInTransaction: jest.fn().mockImplementation((fn) =>
              fn({
                create: jest.fn().mockImplementation((entity, data) => data),
                save: jest.fn().mockImplementation((entity, data) => ({ id: 1, ...data })),
                delete: jest.fn().mockResolvedValue(undefined),
                update: jest.fn().mockResolvedValue(undefined),
              }),
            ),
          },
        },
        {
          provide: CategoryService,
          useValue: {
            getAllCategories: jest.fn().mockResolvedValue([{ id: 1, name: 'Raw' }]),
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
          },
        },
        {
          provide: ProductService,
          useValue: {
            getAllProducts: jest.fn().mockResolvedValue([
              { id: 1, name: 'P1', stock_quantity: 100 },
              { id: 2, name: 'P2', stock_quantity: 50 },
            ]),
            getProduct: jest.fn(),
            deleteProduct: jest.fn(),
            recalculateProductStock: jest.fn(),
            exportProductsToExcel: jest.fn(),
            importProductsFromExcel: jest.fn(),
            bulkUpdatePrices: jest.fn(),
            autoPriceProduct: jest.fn(),
          },
        },
        {
          provide: WarehouseService,
          useValue: {
            getAllWarehouses: jest.fn(),
            initDefaultWarehouses: jest.fn(),
            getWarehouse: jest.fn(),
            getWarehouseStock: jest.fn(),
            createWarehouse: jest.fn(),
            updateWarehouse: jest.fn(),
            deleteWarehouse: jest.fn(),
          },
        },
        {
          provide: StockService,
          useValue: {
            getStock: jest.fn(),
            getStockMovements: jest.fn(),
            updateStockMovement: jest.fn(),
            addStockMovement: jest.fn().mockResolvedValue({ id: 1 }),
            getDefaultWarehouseId: jest.fn().mockResolvedValue(1),
          },
        },
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
            findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Product', sku: 'SKU1' }),
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
            create: jest.fn().mockImplementation((d) => ({ id: 1, ...d })),
            save: jest.fn().mockImplementation((d) => ({ id: 1, ...d })),
            update: jest.fn(),
            findOne: jest.fn().mockResolvedValue(null),
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
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    categoryService = module.get(CategoryService);
    productService = module.get(ProductService);
    warehouseService = module.get(WarehouseService);
    stockService = module.get(StockService);
    transactionHelper = module.get(TransactionHelper);
    productRepo = module.get(getRepositoryToken(Product));
    stockRepo = module.get(getRepositoryToken(Stock));
    warehouseRepo = module.get(getRepositoryToken(Warehouse));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCategories', () => {
    it('should delegate to categoryService.getAllCategories', async () => {
      const categories = [{ id: 1, name: 'Raw' }];
      (categoryService.getAllCategories as jest.Mock).mockResolvedValue(categories);
      const result = await service.getAllCategories();
      expect(result).toEqual(categories);
      expect(categoryService.getAllCategories).toHaveBeenCalled();
    });
  });

  describe('getAllProducts', () => {
    it('should return paginated results from productService', async () => {
      const paginatedResult = {
        data: [
          { id: 1, name: 'P1', stock_quantity: 100 },
          { id: 2, name: 'P2', stock_quantity: 50 },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      (productService.getAllProducts as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await service.getAllProducts({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(productService.getAllProducts).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('should return array results when no pagination', async () => {
      const products = [
        { id: 1, name: 'P1', stock_quantity: 100 },
        { id: 2, name: 'P2', stock_quantity: 50 },
      ];
      (productService.getAllProducts as jest.Mock).mockResolvedValue(products);

      const result = await service.getAllProducts({});

      expect(result).toHaveLength(2);
      expect(productService.getAllProducts).toHaveBeenCalledWith({});
    });

    it('should pass type filter to productService', async () => {
      (productService.getAllProducts as jest.Mock).mockResolvedValue([]);
      await service.getAllProducts({ type: 'RAW' });
      expect(productService.getAllProducts).toHaveBeenCalledWith({ type: 'RAW' });
    });

    it('should pass search filter to productService', async () => {
      (productService.getAllProducts as jest.Mock).mockResolvedValue([]);
      await service.getAllProducts({ search: 'zipper' });
      expect(productService.getAllProducts).toHaveBeenCalledWith({ search: 'zipper' });
    });
  });

  describe('createProduct', () => {
    it('should create with correct type via transaction', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'New Product', category: null, warehouse: null });

      const result = await service.createProduct({
        name: 'New Product',
        type: 'FINISHED',
        initial_stock: 100,
      } as any);

      expect(transactionHelper.runInTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      (transactionHelper.runInTransaction as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
      (productRepo.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        service.createProduct({ name: 'Fail Product', type: 'RAW' } as any),
      ).rejects.toThrow();
    });
  });

  describe('addStockMovement', () => {
    it('should delegate to stockService.addStockMovement with correct params', async () => {
      const movementData = {
        product_id: 1,
        warehouse_id: 1,
        type: MovementType.IN,
        quantity: 10,
      };

      const mockResult = { id: 42, product_id: 1, warehouse_id: 1, type: MovementType.IN, quantity: 10 };
      (stockService.addStockMovement as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.addStockMovement(movementData);

      expect(result).toEqual(mockResult);
      expect(stockService.addStockMovement).toHaveBeenCalledWith(
        movementData,
        undefined,
        undefined,
      );
    });

    it('should pass manager and skipStockCheck to stockService', async () => {
      const movementData = {
        product_id: 1,
        warehouse_id: 1,
        type: MovementType.OUT,
        quantity: 3,
      };

      const mockManager = {} as EntityManager;
      (stockService.addStockMovement as jest.Mock).mockResolvedValue({ id: 1 });

      await service.addStockMovement(movementData, mockManager, true);

      expect(stockService.addStockMovement).toHaveBeenCalledWith(
        movementData,
        mockManager,
        true,
      );
    });

    it('should delegate to stockService.addStockMovement without manager', async () => {
      const movementData = {
        product_id: 1,
        warehouse_id: 1,
        type: MovementType.IN,
        quantity: 10,
      };

      (stockService.addStockMovement as jest.Mock).mockResolvedValue({ id: 1 });

      await service.addStockMovement(movementData);

      expect(stockService.addStockMovement).toHaveBeenCalledWith(
        movementData,
        undefined,
        undefined,
      );
    });
  });

  describe('transferStock', () => {
    it('should transfer stock between warehouses', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Product' });
      (stockRepo.findOne as jest.Mock).mockResolvedValue({
        product_id: 1,
        warehouse_id: 1,
        quantity: 50,
      });

      const result = await service.transferStock({
        product_id: 1,
        from_warehouse_id: 1,
        to_warehouse_id: 2,
      });

      expect(result.success).toBe(true);
      expect(result.quantity).toBe(50);
      expect(transactionHelper.runInTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.transferStock({ product_id: 999, from_warehouse_id: 1, to_warehouse_id: 2 }),
      ).rejects.toThrow('المنتج غير موجود');
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock to new quantity', async () => {
      const stock = { product_id: 1, warehouse_id: 1, quantity: 50 };
      (stockRepo.findOne as jest.Mock).mockResolvedValue(stock);
      (stockRepo.save as jest.Mock).mockResolvedValue({});

      const result = await service.adjustStock({
        product_id: 1,
        warehouse_id: 1,
        new_quantity: 100,
      });

      expect(result.success).toBe(true);
      expect(result.new_quantity).toBe(100);
      expect(stockRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when stock not found', async () => {
      (stockRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.adjustStock({ product_id: 999, warehouse_id: 1, new_quantity: 10 }),
      ).rejects.toThrow('المخزون غير موجود لهذا المنتج');
    });
  });
});
