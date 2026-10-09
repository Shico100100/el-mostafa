import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductCrudService } from './product-crud.service';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Category } from '../entities/category.entity';

describe('ProductCrudService bulk operations', () => {
  let service: ProductCrudService;
  let productRepo: { delete: jest.Mock; update: jest.Mock };
  let categoryRepo: { findOne: jest.Mock };
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    productRepo = { delete: jest.fn(), update: jest.fn() };
    categoryRepo = { findOne: jest.fn() };
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCrudService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Stock), useValue: {} },
        { provide: getRepositoryToken(Warehouse), useValue: {} },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<ProductCrudService>(ProductCrudService);
  });

  it('should delete the given ids and report the count', async () => {
    productRepo.delete.mockResolvedValue({ affected: 2 });
    const result = await service.bulkDeleteProducts([4, 9]);
    expect(productRepo.delete).toHaveBeenCalledWith([4, 9]);
    expect(result).toEqual({ deleted: 2 });
  });

  it('should assign the category when it exists', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 5, name: 'C' });
    productRepo.update.mockResolvedValue({ affected: 3 });
    const result = await service.bulkAssignCategory([1, 2, 3], 5);
    expect(productRepo.update).toHaveBeenCalledWith([1, 2, 3], {
      category_id: 5,
    });
    expect(result).toEqual({ updated: 3 });
  });

  it('should reject an unknown category without touching products', async () => {
    categoryRepo.findOne.mockResolvedValue(null);
    await expect(service.bulkAssignCategory([1], 999)).rejects.toThrow(
      NotFoundException,
    );
    expect(productRepo.update).not.toHaveBeenCalled();
  });

  it('should map summary aggregates to numbers', async () => {
    dataSource.query.mockResolvedValue([
      { total: '10', value: '250.50', low: '2' },
    ]);
    const result = await service.getProductsSummary();
    expect(result).toEqual({
      totalProducts: 10,
      totalValue: 250.5,
      lowStockCount: 2,
    });
    expect(String(dataSource.query.mock.calls[0][0])).toContain(
      'stock_movements',
    );
  });
});

describe('ProductCrudService assembly', () => {
  const bomItem = (over: Record<string, unknown> = {}) => ({
    product_id: 10,
    quantity: 2,
    product: { id: 10, name: 'COMP', cost_price: 5 },
    ...over,
  });
  const bom = {
    id: 1,
    items: [
      bomItem(),
      bomItem({
        product_id: 11,
        quantity: 3,
        product: { id: 11, name: 'C2', cost_price: 7 },
      }),
    ],
  };
  const product = { id: 1, name: 'FIN', cost_price: 0, warehouse_id: 1 };
  const warehouse = { id: 1, name: 'W' };

  function setup(
    o: { stock?: Record<number, number>; bomOverride?: unknown } = {},
  ) {
    const stocks = o.stock ?? { 10: 100, 11: 100 };
    const productRepo: Record<string, jest.Mock> = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const stockRepo: Record<string, jest.Mock> = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((x: unknown) => x),
    };
    const movementRepo: Record<string, jest.Mock> = {
      save: jest.fn(),
      create: jest.fn((x: unknown) => x),
    };
    const warehouseRepo: Record<string, jest.Mock> = { findOne: jest.fn() };
    const bomRepo: Record<string, jest.Mock> = { findOne: jest.fn() };
    const byEntity = new Map<string, unknown>([
      ['Product', productRepo],
      ['Stock', stockRepo],
      ['StockMovement', movementRepo],
      ['Warehouse', warehouseRepo],
      ['BOM', bomRepo],
    ]);
    const stockOf = (_sql: string, params: unknown[]) =>
      Promise.resolve([{ total: String(stocks[Number(params[0])] ?? 0) }]);
    const manager = {
      getRepository: (e: { name: string }) => byEntity.get(e.name),
      query: stockOf,
    };
    const dataSource = {
      getRepository: (e: { name: string }) => byEntity.get(e.name),
      query: jest.fn(stockOf),
      transaction: jest.fn(
        async (fn: (m: unknown) => unknown) => await fn(manager),
      ),
    };
    productRepo.findOne.mockResolvedValue(product);
    warehouseRepo.findOne.mockResolvedValue(warehouse);
    bomRepo.findOne.mockResolvedValue(
      o.bomOverride !== undefined ? o.bomOverride : bom,
    );
    movementRepo.save.mockImplementation((x: unknown) =>
      Promise.resolve({
        id: 99,
        ...(x as object),
      }),
    );
    return {
      productRepo,
      stockRepo,
      movementRepo,
      warehouseRepo,
      bomRepo,
      dataSource,
      manager,
    };
  }

  async function makeService(
    ctx: ReturnType<typeof setup>,
  ): Promise<ProductCrudService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCrudService,
        {
          provide: getRepositoryToken(Product),
          useValue: (ctx as unknown as { productRepo: unknown }).productRepo,
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: (ctx as unknown as { stockRepo: unknown }).stockRepo,
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: (ctx as unknown as { warehouseRepo: unknown })
            .warehouseRepo,
        },
        { provide: getRepositoryToken(Category), useValue: {} },
        {
          provide: DataSource,
          useValue: (ctx as unknown as { dataSource: unknown }).dataSource,
        },
      ],
    }).compile();
    return module.get<ProductCrudService>(ProductCrudService);
  }

  it('should preview components, availability and rolled-up cost', async () => {
    const ctx = setup();
    const service = await makeService(ctx);
    const preview = await service.getAssemblyPreview(1, 10);
    expect(preview.canAssemble).toBe(true);
    expect(preview.unitCost).toBe(2 * 5 + 3 * 7);
    expect(preview.items).toHaveLength(2);
    expect(preview.items[0]).toMatchObject({
      product_id: 10,
      required: 20,
      available: 100,
      shortfall: 0,
    });
    expect(preview.warehouse).toMatchObject({ id: 1 });
  });

  it('should flag shortfalls instead of allowing the assembly', async () => {
    const ctx = setup({ stock: { 10: 5, 11: 100 } });
    const service = await makeService(ctx);
    const preview = await service.getAssemblyPreview(1, 10);
    expect(preview.canAssemble).toBe(false);
    expect(preview.items[0].shortfall).toBe(20 - 5);
  });

  it('should reject products without a recipe', async () => {
    const ctx = setup({ bomOverride: null });
    const service = await makeService(ctx);
    await expect(service.getAssemblyPreview(1, 1)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.assembleProduct(1, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should assemble atomically and roll up the cost', async () => {
    const ctx = setup();
    const service = await makeService(ctx);
    const result = await service.assembleProduct(1, 10);
    expect(result.produced).toBe(10);
    expect(result.unitCost).toBe(2 * 5 + 3 * 7);
    expect(result.consumed).toHaveLength(2);
    expect(result.movementId).toBe(99);
  });

  it('should refuse to half-consume when stock is short', async () => {
    const ctx = setup({ stock: { 10: 0, 11: 100 } });
    const service = await makeService(ctx);
    await expect(service.assembleProduct(1, 10)).rejects.toThrow(
      BadRequestException,
    );
  });
});
