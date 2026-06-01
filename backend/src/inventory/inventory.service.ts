import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import * as XLSX from 'xlsx';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
  ) {}

  // Categories
  async getAllCategories() {
    return this.categoryRepo.find({ relations: ['parent'] });
  }

  async createCategory(data: Partial<Category>) {
    const category = this.categoryRepo.create(data);
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: number, data: Partial<Category>) {
    await this.categoryRepo.update(id, data);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    return this.categoryRepo.delete(id);
  }

  // Products
  async getAllProducts(options: {
    search?: string;
    type?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
    lowStock?: boolean;
  }) {
    const { search, type, categoryId, page, limit, lowStock } = options;

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (type) {
      query.andWhere('product.type = :type', { type });
    } else {
      query.andWhere('product.type != :excludeType', { excludeType: 'SEMI_FINISHED' });
    }

    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Logic: if lowStock is requested, we need to filter products where quantity <= min_stock
    if (lowStock) {
      query.andWhere(
        '(SELECT COALESCE(SUM(s.quantity), 0) FROM stock s WHERE s.product_id = product.id) <= COALESCE(product.min_stock, 0)',
      );
    }

    query.orderBy('product.created_at', 'DESC');

    // Legacy mode: if no pagination params, return all as array
    if (!page && !limit) {
      const products = await query.getMany();
      return this.enrichWithStock(products);
    }

    // Pagination mode
    const p = page || 1;
    const l = limit || 20;
    const skip = (p - 1) * l;

    query.skip(skip).take(l);

    const [products, total] = await query.getManyAndCount();
    const productsWithStock = await this.enrichWithStock(products);

    return {
      data: productsWithStock,
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

    return products.map((product) => ({
      ...product,
      stock_quantity: stockMap.get(product.id) || 0,
    }));
  }

  async getProduct(id: number) {
    return this.productRepo.findOne({ where: { id }, relations: ['category'] });
  }

  async createProduct(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async updateProduct(id: number, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.productRepo.findOne({ where: { id } });
  }

  async deleteProduct(id: number) {
    return this.productRepo.delete(id);
  }

  async recalculateProductStock(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new Error('Product not found');

    const movements = await this.movementRepo.find({
      where: { product_id: id },
    });

    let calculatedQuantity = 0;
    for (const mov of movements) {
      if (mov.type === MovementType.IN) {
        calculatedQuantity += Number(mov.quantity);
      } else if (mov.type === MovementType.OUT) {
        calculatedQuantity -= Number(mov.quantity);
      }
    }

    let stock = await this.stockRepo.findOne({
      where: { product_id: id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: id,
        warehouse_id: 1,
        quantity: 0,
      });
    }

    stock.quantity = calculatedQuantity;
    await this.stockRepo.save(stock);

    return {
      product_id: id,
      calculated_stock: calculatedQuantity,
      movement_count: movements.length,
    };
  }

  // Excel Operations
  async exportProductsToExcel() {
    // Get all products without pagination for export
    const result = await this.getAllProducts({ limit: 10000 }); // Reasonable limit for now
    const products = (result as any).data || result; // Handle both formats just in case

    const data = products.map((p) => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku || '',
      Barcode: p.barcode || '',
      Type: p.type,
      Category: p.category?.name || '',
      'Selling Price': p.selling_price,
      'Cost Price': p.cost_price,
      'Stock Quantity': p.stock_quantity,
      'Min Stock': p.min_stock,
      Unit: p.unit,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importProductsFromExcel(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let updatedCount = 0;

    for (const row of data as any[]) {
      // Mapping fields from flexible header names
      const name = row['Name'] || row['name'] || row['الاسم'];
      if (!name) continue;

      const sku = row['SKU'] || row['sku'];
      const barcode = row['Barcode'] || row['barcode'];

      // Try to find existing product by SKU or Barcode or Name
      let existingProduct: Product | null = null;
      if (sku)
        existingProduct = await this.productRepo.findOne({
          where: { sku: String(sku) },
        });
      if (!existingProduct && barcode)
        existingProduct = await this.productRepo.findOne({
          where: { barcode: String(barcode) },
        });
      if (!existingProduct)
        existingProduct = await this.productRepo.findOne({ where: { name } });

      const productData: Partial<Product> = {
        name,
        sku: sku ? String(sku) : undefined,
        barcode: barcode ? String(barcode) : undefined,
        selling_price: row['Selling Price'] || row['selling_price'] || 0,
        cost_price: row['Cost Price'] || row['cost_price'] || 0,
        min_stock: row['Min Stock'] || row['min_stock'] || 0,
        type: (row['Type'] || row['type'] || 'FINISHED').toUpperCase(),
        unit: row['Unit'] || row['unit'] || 'piece',
      };

      // Handle Category (Simple lookup by name)
      const categoryName = row['Category'] || row['category'];
      if (categoryName) {
        let category = await this.categoryRepo.findOne({
          where: { name: categoryName },
        });
        if (!category) {
          category = await this.categoryRepo.save(
            this.categoryRepo.create({ name: categoryName }),
          );
        }
        productData.category = category;
      }

      if (existingProduct) {
        await this.productRepo.update(existingProduct.id, productData);
        updatedCount++;
      } else {
        await this.productRepo.save(this.productRepo.create(productData));
        createdCount++;
      }
    }

    return { created: createdCount, updated: updatedCount };
  }

  // Warehouses
  async getAllWarehouses() {
    return this.warehouseRepo.find();
  }

  async createWarehouse(data: Partial<Warehouse>) {
    const warehouse = this.warehouseRepo.create(data);
    return this.warehouseRepo.save(warehouse);
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>) {
    await this.warehouseRepo.update(id, data);
    return this.warehouseRepo.findOne({ where: { id } });
  }

  // Stock
  async getStock(productId?: number, warehouseId?: number) {
    const where: any = {};
    if (productId) where.product_id = productId;
    if (warehouseId) where.warehouse_id = warehouseId;

    return this.stockRepo.find({
      where,
      relations: ['product', 'warehouse'],
    });
  }

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
  ) {
    const entityManager = manager || this.movementRepo.manager;

    // Create movement record
    const movement = entityManager.create(StockMovement, {
      ...data,
      date: data.date || new Date(),
    });
    await entityManager.save(StockMovement, movement);

    // Update stock
    let stock = await entityManager.findOne(Stock, {
      where: {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
      },
    });

    if (!stock) {
      stock = entityManager.create(Stock, {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        quantity: 0,
      });
    }

    if (data.type === MovementType.IN) {
      stock.quantity = Number(stock.quantity) + Number(data.quantity);
    } else if (data.type === MovementType.OUT) {
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
    } else if (data.type === MovementType.ADJUST) {
      stock.quantity = Number(data.quantity);
    }

    await entityManager.save(Stock, stock);
    return movement;
  }

  async getStockMovements(productId?: number, warehouseId?: number) {
    const where: any = {};
    if (productId) where.product_id = productId;
    if (warehouseId) where.warehouse_id = warehouseId;

    return this.movementRepo.find({
      where,
      relations: ['product', 'warehouse'],
      order: { date: 'DESC' },
    });
  }

  async updateStockMovement(id: number, data: Partial<StockMovement>) {
    const movement = await this.movementRepo.findOne({ where: { id } });
    if (!movement) {
      throw new Error('Movement not found');
    }

    const oldQuantity = movement.quantity;
    const oldType = movement.type;

    // Update movement
    await this.movementRepo.update(id, data);

    // Recalculate stock if quantity or type changed
    if (data.quantity !== undefined || data.type !== undefined) {
      const newQuantity =
        data.quantity !== undefined ? data.quantity : oldQuantity;
      const newType = data.type !== undefined ? data.type : oldType;

      const stock = await this.stockRepo.findOne({
        where: {
          product_id: movement.product_id,
          warehouse_id: movement.warehouse_id,
        },
      });

      if (stock) {
        // Reverse old movement
        if (oldType === MovementType.IN) {
          stock.quantity = Number(stock.quantity) - Number(oldQuantity);
        } else if (oldType === MovementType.OUT) {
          stock.quantity = Number(stock.quantity) + Number(oldQuantity);
        }

        // Apply new movement
        if (newType === MovementType.IN) {
          stock.quantity = Number(stock.quantity) + Number(newQuantity);
        } else if (newType === MovementType.OUT) {
          stock.quantity = Number(stock.quantity) - Number(newQuantity);
        } else if (newType === MovementType.ADJUST) {
          stock.quantity = Number(newQuantity);
        }

        await this.stockRepo.save(stock);
      }
    }

    return this.movementRepo.findOne({
      where: { id },
      relations: ['product', 'warehouse'],
    });
  }

  async bulkUpdatePrices(data: {
    productIds?: number[];
    categoryId?: number;
    type?: string;
    priceField: 'selling_price' | 'cost_price';
    updateType: 'percentage' | 'fixed';
    value: number;
  }) {
    const { productIds, categoryId, type, priceField, updateType, value } =
      data;

    const query = this.productRepo.createQueryBuilder('product');

    // Apply filters
    if (productIds && productIds.length > 0) {
      query.whereInIds(productIds);
    } else {
      if (categoryId) {
        query.andWhere('product.category_id = :categoryId', { categoryId });
      }
      if (type) {
        query.andWhere('product.type = :type', { type });
      }
    }

    const products = await query.getMany();

    // Update prices
    for (const product of products) {
      let newPrice: number;
      const currentPrice = Number(product[priceField]) || 0;

      if (updateType === 'percentage') {
        newPrice = currentPrice * (1 + value / 100);
      } else {
        newPrice = currentPrice + value;
      }

      // Ensure price is not negative
      newPrice = Math.max(0, newPrice);

      await this.productRepo.update(product.id, {
        [priceField]: newPrice,
      });
    }

    return { updated: products.length };
  }
}
