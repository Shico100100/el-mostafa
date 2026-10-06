import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
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
