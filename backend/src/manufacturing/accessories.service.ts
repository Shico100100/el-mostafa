import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { WarehouseHelper } from './warehouse.helper';

@Injectable()
export class AccessoriesService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    private warehouseHelper: WarehouseHelper,
    private dataSource: DataSource,
  ) {}

  private async findAccessoryProduct(id: number) {
    const product = await this.productRepo.findOne({
      where: { id, type: 'ACCESSORY' as any },
    });
    if (!product) throw new NotFoundException('الإكسسوار غير موجود');
    return product;
  }

  async findAll() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.cost_price,
        p.selling_price,
        p.unit,
        p.type,
        p.description,
        p.min_stock,
        p.weight_grams,
        p.image_path,
        p.reorder_point,
        p.reorder_quantity,
        p.avg_consumption_rate,
        p.last_purchase_price,
        p.last_purchase_date,
        p.weight_per_piece,
        p.preferred_supplier_id,
        p.notes,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(SUM(s.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'ACCESSORY' AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.name ASC
    `);

    // Fetch preferred suppliers in one query
    const supplierIds = [...new Set(rows.map((r: any) => r.preferred_supplier_id).filter(Boolean))];
    let suppliers: any[] = [];
    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      suppliers = await this.dataSource.query(
        `SELECT * FROM suppliers WHERE id IN (${placeholders})`,
        supplierIds,
      );
    }
    const supplierMap = new Map<number, any>();
    for (const s of suppliers) supplierMap.set(s.id, s);

    return rows.map((p: any) => {
      const currentStock = Number(p.current_stock) || 0;
      const supplier = supplierMap.get(p.preferred_supplier_id) || null;
      return {
        id: p.id,
        product: { ...p, preferred_supplier: supplier },
        preferred_supplier: supplier,
        reorder_point: p.reorder_point,
        last_purchase_price: p.last_purchase_price,
        weight_per_piece: p.weight_per_piece,
        image_path: p.image_path,
        notes: p.notes,
        current_stock: currentStock,
        stock_status:
          currentStock === 0
            ? 'OUT_OF_STOCK'
            : currentStock <= Number(p.reorder_point)
              ? 'LOW_STOCK'
              : 'NORMAL',
      };
    });
  }

  async findOne(id: number) {
    const product = await this.findAccessoryProduct(id);
    const stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    return {
      id: product.id,
      product,
      preferred_supplier: product.preferred_supplier,
      reorder_point: product.reorder_point,
      last_purchase_price: product.last_purchase_price,
      weight_per_piece: product.weight_per_piece,
      image_path: product.image_path,
      notes: product.notes,
      current_stock: stock ? Number(stock.quantity) : 0,
    };
  }

  async getTotalValue() {
    const result = await this.dataSource.query(`
      SELECT
        COUNT(p.id) AS count,
        COALESCE(SUM(COALESCE(s.quantity, 0) * p.cost_price), 0) AS total_value
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'ACCESSORY' AND p.deleted_at IS NULL
    `);
    return {
      total_value: Number(result[0]?.total_value) || 0,
      count: Number(result[0]?.count) || 0,
    };
  }

  async getHistory(id: number) {
    await this.findAccessoryProduct(id);
    const movements = await this.stockMovementRepo.find({
      where: { product_id: id },
      order: { date: 'DESC', id: 'DESC' },
      take: 50,
    });
    return movements.map((m) => ({
      id: m.id,
      date: m.date,
      type: m.type,
      quantity: m.quantity,
      notes: m.notes,
    }));
  }

  async getTopConsumed(limit: number) {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.name,
        p.unit,
        COALESCE(SUM(s.quantity), 0) AS current_stock,
        (SELECT sm.date FROM stock_movements sm WHERE sm.product_id = p.id AND sm.type = 'OUT' ORDER BY sm.date DESC LIMIT 1) AS last_movement_date
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'ACCESSORY' AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    const results = rows.map((p: any) => ({
      product: { name: p.name, unit: p.unit },
      total_consumed: 0,
      last_movement_date: p.last_movement_date || null,
      current_stock: Number(p.current_stock) || 0,
    }));
    return results.sort((a: any, b: any) => b.total_consumed - a.total_consumed).slice(0, limit);
  }

  async getSlowMoving(months: number) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.name,
        p.unit,
        COALESCE(SUM(s.quantity), 0) AS current_stock,
        (SELECT sm.date FROM stock_movements sm WHERE sm.product_id = p.id ORDER BY sm.date DESC LIMIT 1) AS last_movement_date
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'ACCESSORY' AND p.deleted_at IS NULL
      GROUP BY p.id
      HAVING
        (SELECT sm.date FROM stock_movements sm WHERE sm.product_id = p.id ORDER BY sm.date DESC LIMIT 1) IS NULL
        OR (SELECT sm.date FROM stock_movements sm WHERE sm.product_id = p.id ORDER BY sm.date DESC LIMIT 1) < $1
      ORDER BY p.name ASC
    `, [cutoff]);

    return rows.map((p: any) => ({
      product: { name: p.name, unit: p.unit },
      current_stock: Number(p.current_stock) || 0,
      last_movement_date: p.last_movement_date || null,
    }));
  }

  async getPODraft() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.name,
        p.reorder_point,
        p.reorder_quantity,
        p.last_purchase_price,
        p.cost_price,
        p.preferred_supplier_id,
        COALESCE(SUM(s.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'ACCESSORY' AND p.deleted_at IS NULL
      GROUP BY p.id
      HAVING COALESCE(SUM(s.quantity), 0) < p.reorder_point
      ORDER BY p.name ASC
    `);

    if (rows.length === 0) return [];

    // Fetch supplier names in one query
    const supplierIds = [...new Set(rows.map((r: any) => r.preferred_supplier_id).filter(Boolean))];
    let suppliers: any[] = [];
    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      suppliers = await this.dataSource.query(
        `SELECT id, name FROM suppliers WHERE id IN (${placeholders})`,
        supplierIds,
      );
    }
    const supplierMap = new Map<number, any>();
    for (const s of suppliers) supplierMap.set(s.id, s);

    return rows.map((p: any) => {
      const currentStock = Number(p.current_stock) || 0;
      const suggestedQty = Number(p.reorder_quantity) || Number(p.reorder_point) * 2;
      const lastPrice = Number(p.last_purchase_price) || Number(p.cost_price);
      const supplier = supplierMap.get(p.preferred_supplier_id);
      return {
        product_name: p.name,
        supplier: supplier?.name || '',
        current_stock: currentStock,
        reorder_point: Number(p.reorder_point),
        suggested_quantity: suggestedQty,
        last_price: lastPrice,
        total_estimated_cost: suggestedQty * lastPrice,
      };
    });
  }

  async create(data: any, image?: any) {
    const product = this.productRepo.create({
      name: data.name,
      unit: data.unit || 'piece',
      type: 'ACCESSORY' as any,
      cost_price: 0,
      selling_price: 0,
      reorder_point: data.reorder_point || 0,
      weight_per_piece: data.weight_per_piece || 0,
      notes: data.notes,
      image_path: image?.filename || null,
    });
    const saved = await this.productRepo.save(product);
    return this.findOne(saved.id);
  }

  async update(id: number, data: any, image?: any) {
    await this.findAccessoryProduct(id);
    const updateData: any = {
      name: data.name,
      unit: data.unit,
      reorder_point: data.reorder_point,
      weight_per_piece: data.weight_per_piece,
      notes: data.notes,
    };
    if (image) updateData.image_path = image.filename;
    await this.productRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findAccessoryProduct(id);
    return this.productRepo.softDelete(id);
  }

  async addStock(id: number, quantity: number, price?: number) {
    const product = await this.findAccessoryProduct(id);
    if (quantity <= 0) throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    const warehouseId = await this.warehouseHelper.getDefaultWarehouseId();
    let stock = await this.stockRepo.findOne({
      where: { product_id: id, warehouse_id: warehouseId },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: id,
        warehouse_id: warehouseId,
        quantity: 0,
      });
    }
    stock.quantity = Number(stock.quantity) + quantity;
    await this.stockRepo.save(stock);

    await this.stockMovementRepo.save(
      this.stockMovementRepo.create({
        product_id: id,
        warehouse_id: warehouseId,
        type: 'IN' as MovementType,
        quantity,
        reference_type: 'accessory_stock_add',
        date: new Date(),
        notes: `إضافة رصيد ${product.name}`,
      }),
    );

    if (price) {
      await this.productRepo.update(id, { last_purchase_price: price, cost_price: price });
    }

    return this.findOne(id);
  }

  async consumeStock(id: number, quantity: number, notes?: string) {
    const product = await this.findAccessoryProduct(id);
    if (quantity <= 0) throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    const warehouseId = await this.warehouseHelper.getDefaultWarehouseId();
    const stock = await this.stockRepo.findOne({
      where: { product_id: id, warehouse_id: warehouseId },
    });
    if (!stock || Number(stock.quantity) < quantity) {
      throw new BadRequestException('الرصيد غير كافٍ');
    }

    stock.quantity = Number(stock.quantity) - quantity;
    await this.stockRepo.save(stock);

    await this.stockMovementRepo.save(
      this.stockMovementRepo.create({
        product_id: id,
        warehouse_id: warehouseId,
        type: 'OUT' as MovementType,
        quantity,
        reference_type: 'accessory_consume',
        date: new Date(),
        notes: notes || `صرف ${product.name}`,
      }),
    );

    return this.findOne(id);
  }

  async bulkAddStock(items: Array<{ id: number; quantity: number; price?: number }>) {
    const results = [];
    for (const item of items) {
      const result = await this.addStock(item.id, item.quantity, item.price);
      results.push(result);
    }
    return results;
  }
}
