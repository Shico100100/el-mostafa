import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class ProductCrudService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async getDefaultWarehouseId(): Promise<number> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (warehouse) return warehouse.id;
    const created = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'المستودع الرئيسي', is_active: true }),
    );
    return created.id;
  }

  async resolveWarehouseId(
    name: string | undefined,
    fallbackId?: number,
  ): Promise<number | undefined> {
    if (name?.startsWith('بلاستيك')) {
      const wh = await this.warehouseRepo.findOne({
        where: { name: 'بلاستيك' },
      });
      if (wh) return wh.id;
    }
    return fallbackId;
  }

  async getAllProducts(options: {
    search?: string;
    type?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
    lowStock?: boolean;
    warehouseId?: number;
  }) {
    const { search, type, categoryId, page, limit, lowStock, warehouseId } =
      options;
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.warehouse', 'warehouse');

    if (warehouseId)
      query.andWhere('product.warehouse_id = :warehouseId', { warehouseId });
    if (type) {
      if (type !== 'ALL') {
        if (type === 'RAW')
          query.andWhere("product.type IN ('RAW', 'RAW_PLASTIC')");
        else query.andWhere('product.type = :type', { type });
      }
    } else {
      query.andWhere('product.type != :excludeType', {
        excludeType: 'SEMI_FINISHED',
      });
    }
    if (categoryId)
      query.andWhere('product.category_id = :categoryId', { categoryId });
    if (search) {
      query.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (lowStock) {
      query.andWhere(
        '(SELECT COALESCE(SUM(s.quantity), 0) FROM stock s WHERE s.product_id = product.id) <= COALESCE(product.min_stock, 0)',
      );
    }
    query.orderBy('product.created_at', 'DESC');

    if (!page && !limit) {
      const products = await query.getMany();
      return this.enrichWithStock(products);
    }

    const p = page || 1;
    const l = limit || 20;
    query.skip((p - 1) * l).take(l);
    const [products, total] = await query.getManyAndCount();
    return {
      data: await this.enrichWithStock(products),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  private async enrichWithStock(products: Product[]) {
    if (products.length === 0) return [];
    const productIds = products.map((p) => p.id);
    const stocks = await this.stockRepo
      .createQueryBuilder('stock')
      .select('stock.product_id', 'product_id')
      .addSelect('SUM(stock.quantity)', 'total')
      .where('stock.product_id IN (:...productIds)', { productIds })
      .groupBy('stock.product_id')
      .getRawMany();
    const stockMap = new Map(
      stocks.map((s) => [Number(s.product_id), Number(s.total)]),
    );
    return products.map((p) => ({
      ...p,
      stock_quantity: stockMap.get(p.id) || 0,
    }));
  }

  async getProduct(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'warehouse'],
    });
  }

  async updateProductSimple(id: number, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'warehouse'],
    });
  }

  async deleteProduct(id: number) {
    return this.productRepo.delete(id);
  }
}
