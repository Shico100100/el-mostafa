import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Category } from '../entities/category.entity';
import {
  StockMovement,
  MovementType,
} from '../entities/stock-movement.entity';
import { BOM } from '../../manufacturing/entities/bom.entity';

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
    private dataSource: DataSource,
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
      query.andWhere("product.type NOT IN ('SEMI_FINISHED', 'DORMANT')");
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
      query
        .leftJoin(
          `(SELECT sm.product_id,
                  COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) -
                  COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) AS stock_total
           FROM stock_movements sm
           GROUP BY sm.product_id)`,
          'stock_totals',
          'stock_totals.product_id = product.id',
        )
        .andWhere(
          'COALESCE(stock_totals.stock_total, 0) <= COALESCE(product.min_stock, 0)',
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
    const stockRows = await this.dataSource.query(
      `SELECT product_id,
        COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS total
      FROM stock_movements
      WHERE product_id = ANY($1)
      GROUP BY product_id`,
      [productIds],
    );
    const stockMap = new Map(
      stockRows.map((s: any) => [Number(s.product_id), Number(s.total)]),
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

  private async movementStock(
    productId: number,
    warehouseId: number,
    manager?: { query: (sql: string, params: unknown[]) => Promise<unknown[]> },
  ): Promise<number> {
    // Same formula the list UI displays (IN minus OUT), so the preview can
    // never disagree with the quantities the user sees on screen.
    const runner = manager ?? this.dataSource;
    const rows = (await runner.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
              COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS total
       FROM stock_movements WHERE product_id = $1 AND warehouse_id = $2`,
      [productId, warehouseId],
    )) as { total: string }[];
    return Number(rows?.[0]?.total) || 0;
  }

  private async resolveAssemblyWarehouse(
    product: Product,
    warehouseId?: number,
  ): Promise<Warehouse> {
    if (warehouseId) {
      const wh = await this.warehouseRepo.findOne({
        where: { id: warehouseId },
      });
      if (!wh) throw new NotFoundException('المخزن غير موجود');
      return wh;
    }
    if (product.warehouse_id) {
      const wh = await this.warehouseRepo.findOne({
        where: { id: product.warehouse_id },
      });
      if (wh) return wh;
    }
    const fallback = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (!fallback) throw new NotFoundException('لا يوجد مخزن متاح');
    return fallback;
  }

  private async loadAssemblyBom(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    const bom = await this.dataSource.getRepository(BOM).findOne({
      where: { product_id: productId },
      relations: ['items', 'items.product'],
    });
    if (!bom || !bom.items || bom.items.length === 0) {
      throw new NotFoundException('المنتج ده ملهوش مكونات (BOM) — عرّف الوصفة الأول');
    }
    return { product, bom };
  }

  async getAssemblyPreview(
    productId: number,
    quantity: number,
    warehouseId?: number,
  ) {
    const { product, bom } = await this.loadAssemblyBom(productId);
    const warehouse = await this.resolveAssemblyWarehouse(
      product,
      warehouseId,
    );
    const items = [];
    let unitCost = 0;
    for (const item of bom.items) {
      const required = Number(item.quantity) * quantity;
      const available = await this.movementStock(
        item.product_id,
        warehouse.id,
      );
      const itemUnitCost = Number(item.product?.cost_price) || 0;
      unitCost += itemUnitCost * Number(item.quantity);
      items.push({
        product_id: item.product_id,
        name: item.product?.name || `#${item.product_id}`,
        bomQty: Number(item.quantity),
        required,
        available,
        shortfall: Math.max(0, required - available),
        unitCost: itemUnitCost,
      });
    }
    return {
      product: { id: product.id, name: product.name },
      warehouse: { id: warehouse.id, name: warehouse.name },
      quantity,
      unitCost: Math.round(unitCost * 100) / 100,
      totalCost: Math.round(unitCost * quantity * 100) / 100,
      canAssemble: items.every((i) => i.shortfall <= 0),
      items,
    };
  }

  /**
   * Assemble `quantity` units of a BOM product inside ONE warehouse.
   * All-or-nothing: every component is re-checked inside the transaction,
   * so a concurrent sale cannot leave a half-consumed assembly behind.
   */
  async assembleProduct(
    productId: number,
    quantity: number,
    warehouseId?: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const stockRepo = manager.getRepository(Stock);
      const movementRepo = manager.getRepository(StockMovement);
      const warehouseRepo = manager.getRepository(Warehouse);

      const product = await productRepo.findOne({
        where: { id: productId },
      });
      if (!product) throw new NotFoundException('المنتج غير موجود');
      const bomRepo = manager.getRepository(BOM);
      const bom = await bomRepo.findOne({
        where: { product_id: productId },
        relations: ['items', 'items.product'],
      });
      if (!bom || !bom.items || bom.items.length === 0) {
        throw new NotFoundException('المنتج ده ملهوش مكونات (BOM) — عرّف الوصفة الأول');
      }
      let warehouse: Warehouse | null = null;
      if (warehouseId) {
        warehouse = await warehouseRepo.findOne({ where: { id: warehouseId } });
        if (!warehouse) throw new NotFoundException('المخزن غير موجود');
      } else if (product.warehouse_id) {
        warehouse = await warehouseRepo.findOne({
          where: { id: product.warehouse_id },
        });
      }
      if (!warehouse) {
        warehouse = await warehouseRepo.findOne({
          where: { is_active: true },
          order: { id: 'ASC' },
        });
      }
      if (!warehouse) throw new NotFoundException('لا يوجد مخزن متاح');
      const whId = warehouse.id;

      // Re-check everything inside the transaction: fail BEFORE touching
      // any row when anything is short.
      const needs: {
        item: (typeof bom.items)[number];
        required: number;
      }[] = [];
      let unitCost = 0;
      for (const item of bom.items) {
        const required = Number(item.quantity) * quantity;
        const available = await this.movementStock(
          item.product_id,
          whId,
          manager as unknown as {
            query: (sql: string, params: unknown[]) => Promise<unknown[]>;
          },
        );
        if (available < required) {
          throw new BadRequestException(
            `المخزون لا يكفي: ${item.product?.name || `#${item.product_id}`} (المطلوب ${required}، المتاح ${available})`,
          );
        }
        unitCost += (Number(item.product?.cost_price) || 0) * Number(item.quantity);
        needs.push({ item, required });
      }
      unitCost = Math.round(unitCost * 100) / 100;

      // Finished-goods IN first so component OUTs can reference it.
      const finishedIn = await movementRepo.save(
        movementRepo.create({
          product_id: productId,
          warehouse_id: whId,
          type: MovementType.IN,
          quantity,
          reference_type: 'ASSEMBLY',
          date: new Date(),
          notes: `تجميع ${quantity} × ${product.name}`,
        }),
      );
      let finishedStock = await stockRepo.findOne({
        where: { product_id: productId, warehouse_id: whId },
      });
      if (!finishedStock) {
        finishedStock = stockRepo.create({
          product_id: productId,
          warehouse_id: whId,
          quantity: 0,
        });
      }
      finishedStock.quantity = Number(finishedStock.quantity) + quantity;
      await stockRepo.save(finishedStock);

      const consumed = [];
      for (const { item, required } of needs) {
        await movementRepo.save(
          movementRepo.create({
            product_id: item.product_id,
            warehouse_id: whId,
            type: MovementType.OUT,
            quantity: required,
            reference_type: 'ASSEMBLY',
            reference_id: finishedIn.id,
            date: new Date(),
            notes: `مكون تجميع ${product.name} × ${quantity}`,
          }),
        );
        const stockRow = await stockRepo.findOne({
          where: { product_id: item.product_id, warehouse_id: whId },
        });
        if (!stockRow) {
          // Movements say stock exists but the cache row is missing: rebuild
          // it from the ledger instead of failing the assembly.
          const ledger = await this.movementStock(
            item.product_id,
            whId,
            manager as unknown as {
              query: (sql: string, params: unknown[]) => Promise<unknown[]>;
            },
          );
          await stockRepo.save(
            stockRepo.create({
              product_id: item.product_id,
              warehouse_id: whId,
              quantity: ledger - required,
            }),
          );
        } else {
          stockRow.quantity = Number(stockRow.quantity) - required;
          await stockRepo.save(stockRow);
        }
        consumed.push({
          product_id: item.product_id,
          name: item.product?.name || `#${item.product_id}`,
          required,
        });
      }

      product.cost_price = unitCost as unknown as number;
      await productRepo.save(product);
      return {
        produced: quantity,
        product: { id: product.id, name: product.name },
        warehouse: { id: warehouse.id, name: warehouse.name },
        unitCost,
        totalCost: Math.round(unitCost * quantity * 100) / 100,
        consumed,
        movementId: finishedIn.id,
      };
    });
  }

  /**
   * Hard-delete many products at once. Same semantics as the single delete
   * (no soft-delete layer exists), so the UI must confirm with a count.
   */
  async bulkDeleteProducts(ids: number[]): Promise<{ deleted: number }> {
    const res = await this.productRepo.delete(ids);
    return { deleted: res.affected ?? 0 };
  }

  async bulkAssignCategory(
    ids: number[],
    categoryId: number,
  ): Promise<{ updated: number }> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة');
    const res = await this.productRepo.update(ids, {
      category_id: categoryId,
    });
    return { updated: res.affected ?? 0 };
  }

  /**
   * Global totals over the same scope the list page browses by default
   * (SEMI_FINISHED and DORMANT excluded), so the stat cards agree with the
   * table instead of summing only the visible page.
   */
  async getProductsSummary(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
  }> {
    const raw = await this.dataSource.query(
      `SELECT COUNT(*) AS total,
        COALESCE(SUM(p.cost_price * COALESCE(s.stock_total, 0)), 0) AS value,
        COALESCE(SUM(CASE WHEN COALESCE(s.stock_total, 0) <= COALESCE(p.min_stock, 0) THEN 1 ELSE 0 END), 0) AS low
       FROM products p
       LEFT JOIN (
         SELECT product_id,
           COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS stock_total
         FROM stock_movements GROUP BY product_id
       ) s ON s.product_id = p.id
       WHERE p.type NOT IN ('SEMI_FINISHED', 'DORMANT')`,
    );
    const row = raw?.[0] || {};
    return {
      totalProducts: Number(row.total) || 0,
      totalValue: Number(row.value) || 0,
      lowStockCount: Number(row.low) || 0,
    };
  }
}
