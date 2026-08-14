import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';
import { MovementType, StockMovement } from './entities/stock-movement.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { WarehouseService } from './warehouse.service';
import { StockService } from './stock.service';
import { TransactionHelper } from '../common/transaction.helper';

@Injectable()
export class InventoryService {
  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private stockService: StockService,
    private transactionHelper: TransactionHelper,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
  ) {}

  // ==================== CATEGORY DELEGATION ====================
  async getAllCategories() {
    return this.categoryService.getAllCategories();
  }
  async createCategory(data: Partial<Category>) {
    return this.categoryService.createCategory(data);
  }
  async updateCategory(id: number, data: Partial<Category>) {
    return this.categoryService.updateCategory(id, data);
  }
  async deleteCategory(id: number) {
    return this.categoryService.deleteCategory(id);
  }

  // ==================== PRODUCT DELEGATION ====================
  async getAllProducts(options: {
    search?: string;
    type?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
    lowStock?: boolean;
    warehouseId?: number;
  }) {
    return this.productService.getAllProducts(options);
  }
  async getProduct(id: number) {
    return this.productService.getProduct(id);
  }
  async deleteProduct(id: number) {
    return this.productService.deleteProduct(id);
  }
  async recalculateProductStock(id: number) {
    return this.productService.recalculateProductStock(id);
  }
  async exportProductsToExcel() {
    return this.productService.exportProductsToExcel();
  }
  async importProductsFromExcel(buffer: Buffer) {
    return this.productService.importProductsFromExcel(buffer);
  }
  async bulkUpdatePrices(data: {
    productIds?: number[];
    categoryId?: number;
    type?: string;
    priceField: 'selling_price' | 'cost_price';
    updateType: 'percentage' | 'fixed';
    value: number;
  }) {
    return this.productService.bulkUpdatePrices(data);
  }
  async autoPriceProduct(productId: number) {
    return this.productService.autoPriceProduct(productId);
  }

  // ==================== WAREHOUSE DELEGATION ====================
  async getAllWarehouses() {
    return this.warehouseService.getAllWarehouses();
  }
  async initDefaultWarehouses() {
    return this.warehouseService.initDefaultWarehouses();
  }
  async getWarehouse(id: number) {
    return this.warehouseService.getWarehouse(id);
  }
  async getWarehouseStock(warehouseId: number) {
    return this.warehouseService.getWarehouseStock(warehouseId);
  }
  async createWarehouse(data: Partial<Warehouse>) {
    return this.warehouseService.createWarehouse(data);
  }
  async updateWarehouse(id: number, data: Partial<Warehouse>) {
    return this.warehouseService.updateWarehouse(id, data);
  }
  async deleteWarehouse(id: number) {
    return this.warehouseService.deleteWarehouse(id);
  }

  // ==================== STOCK DELEGATION ====================
  async getStock(productId?: number, warehouseId?: number) {
    return this.stockService.getStock(productId, warehouseId);
  }
  async getStockMovements(productId?: number, warehouseId?: number) {
    return this.stockService.getStockMovements(productId, warehouseId);
  }
  async updateStockMovement(id: number, data: Partial<StockMovement>) {
    return this.stockService.updateStockMovement(id, data);
  }

  // ==================== METHODS KEPT FOR EXTERNAL MODULES (purchases, sales) ====================
  async addStockMovement(
    data: {
      product_id: number;
      warehouse_id: number;
      type: MovementType;
      quantity: number;
      notes?: string;
      date?: Date;
    },
    manager?: EntityManager,
    skipStockCheck?: boolean,
  ) {
    return this.stockService.addStockMovement(data, manager, skipStockCheck);
  }

  async getDefaultWarehouseId(): Promise<number> {
    return this.stockService.getDefaultWarehouseId();
  }

  // ==================== COMPLEX TRANSACTIONS ====================

  async createProduct(data: Partial<Product> & { initial_stock?: number }) {
    const { initial_stock, ...productData } = data;
    const warehouseId =
      productData.warehouse_id || (await this.getDefaultWarehouseId());

    const saved = await this.transactionHelper.runInTransaction(
      async (manager) => {
        const product = manager.create(Product, {
          ...productData,
          warehouse_id: warehouseId,
        });
        const saved = await manager.save(Product, product);

        await manager.save(
          manager.create(Stock, {
            product_id: saved.id,
            warehouse_id: warehouseId,
            quantity: 0,
          }),
        );

        if (initial_stock && initial_stock > 0) {
          await this.addStockMovement(
            {
              product_id: saved.id,
              warehouse_id: warehouseId,
              type: MovementType.IN,
              quantity: initial_stock,
              notes: 'المخزون الافتتاحي',
            },
            manager,
          );
        }

        return saved;
      },
    );
    return this.productRepo.findOne({
      where: { id: saved.id },
      relations: ['category', 'warehouse'],
    });
  }

  async updateProduct(
    id: number,
    data: Partial<Product> & { initial_stock?: number },
  ) {
    const { initial_stock, ...productData } = data;
    const oldProduct = await this.productRepo.findOne({ where: { id } });

    if (
      productData.warehouse_id &&
      oldProduct &&
      oldProduct.warehouse_id !== productData.warehouse_id
    ) {
      const oldStock = await this.stockRepo.findOne({
        where: { product_id: id, warehouse_id: oldProduct.warehouse_id },
      });
      const qty = oldStock ? Number(oldStock.quantity) : 0;

      await this.transactionHelper.runInTransaction(async (manager) => {
        if (qty > 0) {
          await this.addStockMovement(
            {
              product_id: id,
              warehouse_id: oldProduct.warehouse_id,
              type: MovementType.OUT,
              quantity: qty,
              notes: `نقل إلى المخزن ${productData.warehouse_id}`,
            },
            manager,
          );
        }
        await manager.delete(Stock, {
          product_id: id,
          warehouse_id: oldProduct.warehouse_id,
        });
        await manager.save(
          manager.create(Stock, {
            product_id: id,
            warehouse_id: productData.warehouse_id,
            quantity: 0,
          }),
        );
        if (qty > 0) {
          await this.addStockMovement(
            {
              product_id: id,
              warehouse_id: productData.warehouse_id!,
              type: MovementType.IN,
              quantity: qty,
              notes: `نقل من المخزن ${oldProduct.warehouse_id}`,
            },
            manager,
          );
        }
      });
    }

    const targetWarehouseId =
      productData.warehouse_id ?? oldProduct?.warehouse_id;

    if (initial_stock !== undefined && oldProduct && targetWarehouseId) {
      const targetQty = Number(initial_stock);
      if (targetQty >= 0) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: id, warehouse_id: targetWarehouseId },
        });
        const currentQty = stock ? Number(stock.quantity) : 0;
        const delta = targetQty - currentQty;
        if (delta !== 0) {
          await this.addStockMovement({
            product_id: id,
            warehouse_id: targetWarehouseId,
            type: delta > 0 ? MovementType.IN : MovementType.OUT,
            quantity: Math.abs(delta),
            notes: 'تعديل المخزون السريع',
          });
        }
      }
    }

    await this.productRepo.update(id, productData);
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'warehouse'],
    });
  }

  async markProductAsDormant(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    if (product.type === 'DORMANT')
      throw new BadRequestException('المنتج خامل بالفعل');

    let dormantWarehouse = await this.warehouseRepo.findOne({
      where: { name: 'خامل' },
    });
    if (!dormantWarehouse) {
      dormantWarehouse = await this.warehouseRepo.save(
        this.warehouseRepo.create({ name: 'خامل', is_active: true }),
      );
    }

    return this.updateProduct(productId, {
      type: 'DORMANT',
      warehouse_id: dormantWarehouse.id,
    });
  }

  async restoreProduct(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    if (product.type !== 'DORMANT')
      throw new BadRequestException('المنتج ليس خاملاً');

    const defaultWarehouse = await this.warehouseRepo.findOne({
      where: { name: 'منتج تام' },
    });
    const targetWarehouseId = defaultWarehouse
      ? defaultWarehouse.id
      : await this.getDefaultWarehouseId();

    return this.updateProduct(productId, {
      type: 'FINISHED',
      warehouse_id: targetWarehouseId,
    });
  }

  async transferStock(data: {
    product_id: number;
    from_warehouse_id: number;
    to_warehouse_id: number;
    notes?: string;
  }) {
    const { product_id, from_warehouse_id, to_warehouse_id, notes } = data;
    const product = await this.productRepo.findOne({
      where: { id: product_id },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    const stock = await this.stockRepo.findOne({
      where: { product_id, warehouse_id: from_warehouse_id },
    });
    const qty = stock ? Number(stock.quantity) : 0;

    await this.transactionHelper.runInTransaction(async (manager) => {
      if (qty > 0) {
        await this.addStockMovement(
          {
            product_id,
            warehouse_id: from_warehouse_id,
            type: MovementType.OUT,
            quantity: qty,
            notes: notes
              ? `نقل إلى المخزن ${to_warehouse_id} - ${notes}`
              : `نقل إلى المخزن ${to_warehouse_id}`,
          },
          manager,
        );
      }
      await manager.delete(Stock, {
        product_id,
        warehouse_id: from_warehouse_id,
      });
      await manager.save(
        manager.create(Stock, {
          product_id,
          warehouse_id: to_warehouse_id,
          quantity: 0,
        }),
      );
      if (qty > 0) {
        await this.addStockMovement(
          {
            product_id,
            warehouse_id: to_warehouse_id,
            type: MovementType.IN,
            quantity: qty,
            notes: notes
              ? `نقل من المخزن ${from_warehouse_id} - ${notes}`
              : `نقل من المخزن ${from_warehouse_id}`,
          },
          manager,
        );
      }
      await manager.update(Product, product_id, {
        warehouse_id: to_warehouse_id,
      });
    });
    return {
      success: true,
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity: qty,
    };
  }

  async adjustStock(data: {
    product_id: number;
    warehouse_id: number;
    new_quantity: number;
    notes?: string;
  }) {
    const stock = await this.stockRepo.findOne({
      where: { product_id: data.product_id, warehouse_id: data.warehouse_id },
    });
    if (!stock) throw new NotFoundException('المخزون غير موجود لهذا المنتج');
    stock.quantity = data.new_quantity;
    await this.stockRepo.save(stock);
    await this.addStockMovement({
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      type: MovementType.ADJUST,
      quantity: data.new_quantity,
      notes: data.notes
        ? `تعديل يدوي - ${data.notes} (الكمية الجديدة: ${data.new_quantity})`
        : `تعديل يدوي (الكمية الجديدة: ${data.new_quantity})`,
    });
    return {
      success: true,
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      new_quantity: data.new_quantity,
    };
  }

  async smartAssignWarehouses() {
    const [whAccessory, whPlastic, whPacking, whFinished] = await Promise.all([
      this.warehouseRepo.findOne({ where: { name: 'اكسسوار' } }),
      this.warehouseRepo.findOne({ where: { name: 'بلاستيك' } }),
      this.warehouseRepo.findOne({ where: { name: 'تعبئة وتغليف' } }),
      this.warehouseRepo.findOne({ where: { name: 'منتج تام' } }),
    ]);
    if (!whAccessory || !whPlastic || !whPacking || !whFinished) {
      throw new BadRequestException(
        'الرجاء تهيئة المخازن الافتراضية أولاً (اضغط على زر تهيئة المخازن)',
      );
    }

    const whMap: Record<string, number> = {
      FINISHED: whFinished.id,
      ACCESSORY: whAccessory.id,
      PACKING: whPacking.id,
      PLASTIC: whPlastic.id,
    };
    const allProducts = await this.productRepo.find({
      relations: ['category'],
    });

    const accessoryKeywords = [
      'اكسسوار',
      'accessory',
      'سوستة',
      'zipper',
      'زر',
      'button',
      'handle',
      'مقبض',
      'قفل',
      'lock',
      'مشبك',
      'clip',
      'شريط',
      'ribbon',
      'تاج',
      'crown',
      'ديكور',
      'decor',
    ];
    const packingKeywords = [
      'تعبئة',
      'تغليف',
      'كرتون',
      'box',
      'pack',
      'كيس',
      'bag',
      'استيكر',
      'sticker',
      'بطاقة',
      'label',
      'tag',
      'فويل',
      'foil',
      'wrap',
      'سلوفان',
      'cellophane',
      'علب',
    ];

    const result = await this.transactionHelper.runInTransaction(
      async (manager) => {
        let assigned = 0,
          changed = 0;
        for (const product of allProducts) {
          let targetWarehouseId: number;
          const nameLower = product.name.toLowerCase();
          const catName = product.category?.name?.toLowerCase() || '';

          if (product.name.startsWith('بلاستيك'))
            targetWarehouseId = whMap.PLASTIC;
          else if (product.type === 'RAW' || product.type === 'RAW_PLASTIC')
            targetWarehouseId = whMap.PLASTIC;
          else if (product.type === 'FINISHED')
            targetWarehouseId = whMap.FINISHED;
          else if (product.type === 'PACKAGING')
            targetWarehouseId = whMap.PACKING;
          else if (product.type === 'IMPORTED')
            targetWarehouseId = whMap.ACCESSORY;
          else {
            targetWarehouseId = packingKeywords.some(
              (kw) => nameLower.includes(kw) || catName.includes(kw),
            )
              ? whMap.PACKING
              : accessoryKeywords.some(
                    (kw) => nameLower.includes(kw) || catName.includes(kw),
                  )
                ? whMap.ACCESSORY
                : whMap.PLASTIC;
          }

          if (targetWarehouseId !== product.warehouse_id) {
            const oldWH = product.warehouse_id;
            await manager.update(Product, product.id, {
              warehouse_id: targetWarehouseId,
            });
            const stock = await manager.findOne(Stock, {
              where: { product_id: product.id, warehouse_id: oldWH },
            });
            const qty = stock ? Number(stock.quantity) : 0;
            if (stock)
              await manager.delete(Stock, {
                product_id: product.id,
                warehouse_id: oldWH,
              });
            await manager.save(
              manager.create(Stock, {
                product_id: product.id,
                warehouse_id: targetWarehouseId,
                quantity: 0,
              }),
            );

            if (qty > 0) {
              if (oldWH)
                await this.addStockMovement(
                  {
                    product_id: product.id,
                    warehouse_id: oldWH,
                    type: MovementType.OUT,
                    quantity: qty,
                    notes: `إعادة توزيع ذكي من المخزن ${oldWH}`,
                  },
                  manager,
                );
              await this.addStockMovement(
                {
                  product_id: product.id,
                  warehouse_id: targetWarehouseId,
                  type: MovementType.IN,
                  quantity: qty,
                  notes: `إعادة توزيع ذكي إلى ${targetWarehouseId}`,
                },
                manager,
              );
            }
            if (oldWH) changed++;
            else assigned++;
          }
        }
        return { assigned, changed };
      },
    );
    return {
      ...result,
      total: allProducts.length,
      message:
        result.assigned + result.changed > 0
          ? `تم توزيع ${result.assigned + result.changed} منتج (${result.assigned} توزيع جديد، ${result.changed} إعادة توزيع)`
          : 'جميع المنتجات في المخازن الصحيحة بالفعل',
    };
  }
}
