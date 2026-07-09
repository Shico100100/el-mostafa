import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { jsonToSheetBuffer } from '../utils/excel-export';
import { WarehouseHelper } from './warehouse.helper';

@Injectable()
export class RawMaterialService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(RawMaterialConsumption)
    private consumptionRepo: Repository<RawMaterialConsumption>,
    @InjectRepository(SupplierMaterial)
    private supplierMaterialRepo: Repository<SupplierMaterial>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    private warehouseHelper: WarehouseHelper,
    private dataSource: DataSource,
  ) {}

  private async findRawProduct(id: number) {
    const product = await this.productRepo.findOne({
      where: { id, type: 'RAW' },
    });
    if (!product) throw new NotFoundException('المادة الخام غير موجودة');
    return product;
  }

  async getRawMaterials() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.id AS product_id,
        p.name AS product_name,
        p.preferred_supplier_id,
        p.reorder_point,
        p.reorder_quantity,
        p.avg_consumption_rate,
        p.last_purchase_price,
        p.last_purchase_date,
        p.notes,
        p.created_at,
        p.updated_at,
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
        p.raw_material_type,
        p.weight_per_piece,
        p.is_active,
        COALESCE(SUM(s.quantity), 0) AS current_stock,
        s.warehouse_id
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'RAW' AND p.deleted_at IS NULL
      GROUP BY p.id, s.warehouse_id
      ORDER BY p.name ASC
    `);

    // Aggregate stock across warehouses per product
    const stockMap = new Map<number, number>();
    const productMap = new Map<number, any>();
    for (const row of rows) {
      const qty = Number(row.current_stock) || 0;
      if (productMap.has(row.id)) {
        const existing = stockMap.get(row.id) || 0;
        stockMap.set(row.id, existing + qty);
      } else {
        productMap.set(row.id, row);
        stockMap.set(row.id, qty);
      }
    }

    // Fetch preferred suppliers for all products in one query
    const productIds = [...productMap.keys()];
    let suppliers: any[] = [];
    if (productIds.length > 0) {
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      suppliers = await this.dataSource.query(
        `SELECT * FROM suppliers WHERE id IN (SELECT preferred_supplier_id FROM products WHERE id IN (${placeholders}) AND preferred_supplier_id IS NOT NULL)`,
        productIds,
      );
    }
    const supplierMap = new Map<number, any>();
    for (const s of suppliers) supplierMap.set(s.id, s);

    return [...productMap.values()].map((p) => {
      const currentStock = stockMap.get(p.id) || 0;
      return {
        id: p.id,
        product_id: p.id,
        product: { ...p, preferred_supplier: supplierMap.get(p.preferred_supplier_id) || null, name: p.product_name },
        product_name: p.product_name,
        preferred_supplier_id: p.preferred_supplier_id,
        preferred_supplier: supplierMap.get(p.preferred_supplier_id) || null,
        reorder_point: p.reorder_point,
        reorder_quantity: p.reorder_quantity,
        avg_consumption_rate: p.avg_consumption_rate,
        last_purchase_price: p.last_purchase_price,
        last_purchase_date: p.last_purchase_date,
        notes: p.notes,
        current_stock: currentStock,
        stock_status:
          currentStock === 0
            ? 'OUT_OF_STOCK'
            : currentStock <= Number(p.reorder_point)
              ? 'LOW_STOCK'
              : 'NORMAL',
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });
  }

  async getRawMaterial(id: number) {
    const product = await this.productRepo.findOne({
      where: { id, type: 'RAW' },
      relations: ['preferred_supplier'],
    });
    if (!product) throw new NotFoundException('المادة الخام غير موجودة');
    const supplierMaterials = await this.supplierMaterialRepo.find({
      where: { product_id: product.id },
      relations: ['supplier'],
    });
    const stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    return {
      id: product.id,
      product_id: product.id,
      product,
      preferred_supplier_id: product.preferred_supplier_id,
      preferred_supplier: product.preferred_supplier,
      reorder_point: product.reorder_point,
      reorder_quantity: product.reorder_quantity,
      avg_consumption_rate: product.avg_consumption_rate,
      last_purchase_price: product.last_purchase_price,
      last_purchase_date: product.last_purchase_date,
      notes: product.notes,
      supplier_materials: supplierMaterials,
      current_stock: stock ? Number(stock.quantity) : 0,
    };
  }

  async createRawMaterial(data: { product_id: number; reorder_point?: number; reorder_quantity?: number; avg_consumption_rate?: number; notes?: string }) {
    const product = await this.productRepo.findOne({
      where: { id: data.product_id },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    if (product.type !== 'RAW')
      throw new BadRequestException('نوع المنتج يجب أن يكون مادة خام');
    await this.productRepo.update(data.product_id, {
      reorder_point: data.reorder_point ?? 0,
      reorder_quantity: data.reorder_quantity ?? 0,
      avg_consumption_rate: data.avg_consumption_rate ?? 0,
      notes: data.notes,
    });
    return this.getRawMaterial(data.product_id);
  }

  async updateRawMaterial(id: number, data: { reorder_point?: number; reorder_quantity?: number; avg_consumption_rate?: number; notes?: string }) {
    await this.findRawProduct(id);
    await this.productRepo.update(id, data);
    return this.getRawMaterial(id);
  }

  async deleteRawMaterial(id: number) {
    const product = await this.findRawProduct(id);
    return this.productRepo.softDelete(product.id);
  }

  async recordConsumption(data: {
    product_id: number;
    quantity: number;
    assembly_order_id?: number;
    production_id?: number;
    batch_number?: string;
    notes?: string;
  }) {
    const product = await this.findRawProduct(data.product_id);
    const costPerUnit = product.last_purchase_price || product.cost_price || 0;
    const totalCost = Number(costPerUnit) * Number(data.quantity);

    const consumption = this.consumptionRepo.create({
      ...data,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      consumed_at: new Date(),
    });

    const stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (stock) {
      if (Number(stock.quantity) < Number(data.quantity)) {
        throw new BadRequestException(
          `رصيد غير كافٍ للمادة الخام: ${product.name} (المطلوب: ${data.quantity}, المتوفر: ${stock.quantity})`,
        );
      }
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
      await this.stockRepo.save(stock);
      await this.stockMovementRepo.save({
        product_id: product.id,
        warehouse_id: stock.warehouse_id,
        type: MovementType.OUT,
        quantity: data.quantity,
        reference_type: 'CONSUMPTION',
        reference_id: data.assembly_order_id || data.production_id || 0,
        date: new Date(),
        notes: data.notes || 'Raw material consumption',
      });
    }
    return this.consumptionRepo.save(consumption);
  }

  async getConsumptionHistory(filters?: {
    product_id?: number;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const where: any = {};
    if (filters?.product_id)
      where.product_id = filters.product_id;
    if (filters?.start_date && filters?.end_date)
      where.consumed_at = Between(filters.start_date, filters.end_date);
    const [items, total] = await this.consumptionRepo.findAndCount({
      where,
      relations: ['product', 'assembly_order', 'production'],
      order: { consumed_at: 'DESC' },
      skip,
      take,
    });
    return {
      items,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getLowStockAlerts() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.id AS product_id,
        p.name AS product_name,
        p.preferred_supplier_id,
        p.reorder_point,
        p.reorder_quantity,
        p.avg_consumption_rate,
        p.last_purchase_price,
        p.last_purchase_date,
        p.notes,
        p.created_at,
        p.updated_at,
        COALESCE(SUM(s.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.type = 'RAW' AND p.deleted_at IS NULL
      GROUP BY p.id
      HAVING COALESCE(SUM(s.quantity), 0) <= p.reorder_point
      ORDER BY p.name ASC
    `);

    return rows.map((p: any) => ({
      id: p.id,
      product_id: p.id,
      product: p,
      product_name: p.product_name,
      preferred_supplier_id: p.preferred_supplier_id,
      preferred_supplier: null,
      reorder_point: p.reorder_point,
      reorder_quantity: p.reorder_quantity,
      avg_consumption_rate: p.avg_consumption_rate,
      last_purchase_price: p.last_purchase_price,
      last_purchase_date: p.last_purchase_date,
      notes: p.notes,
      current_stock: Number(p.current_stock),
      stock_status:
        Number(p.current_stock) === 0
          ? 'OUT_OF_STOCK'
          : 'LOW_STOCK',
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  }

  async getSupplierMaterials(supplierId: number) {
    return this.supplierMaterialRepo.find({
      where: { supplier: { id: supplierId } },
      relations: ['product'],
    });
  }

  async getMaterialSuppliers(productId: number) {
    return this.supplierMaterialRepo.find({
      where: { product: { id: productId } },
      relations: ['supplier'],
      order: { is_preferred: 'DESC', price: 'ASC' },
    });
  }

  async addSupplierMaterial(data: Partial<SupplierMaterial>) {
    if (data.is_preferred && data.product_id) {
      await this.supplierMaterialRepo.update(
        { product: { id: data.product_id } },
        { is_preferred: false },
      );
    }
    return this.supplierMaterialRepo.save(
      this.supplierMaterialRepo.create(data),
    );
  }

  async updateSupplierMaterial(id: number, data: Partial<SupplierMaterial>) {
    if (data.is_preferred) {
      const existing = await this.supplierMaterialRepo.findOne({
        where: { id },
      });
      if (existing) {
        await this.supplierMaterialRepo.update(
          { product: { id: existing.product_id } },
          { is_preferred: false },
        );
      }
    }
    await this.supplierMaterialRepo.update(id, data);
    return this.supplierMaterialRepo.findOne({ where: { id } });
  }

  async addRawMaterialStock(data: {
    product_id: number;
    quantity: number;
    price?: number;
    supplier_id?: number;
    date: Date;
    notes?: string;
  }) {
    const product = await this.findRawProduct(data.product_id);

    if (data.price) {
      await this.productRepo.update(product.id, {
        last_purchase_price: data.price,
        cost_price: data.price,
      });
    }

    const warehouseId = await this.warehouseHelper.getDefaultWarehouseId();
    let stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: product.id,
        warehouse_id: warehouseId,
        quantity: 0,
      });
    }
    stock.quantity = Number(stock.quantity) + Number(data.quantity);
    await this.stockRepo.save(stock);

    const movement = this.stockMovementRepo.create({
      product_id: product.id,
      warehouse_id: stock?.warehouse_id || warehouseId,
      type: MovementType.IN,
      quantity: data.quantity,
      reference_type: 'PURCHASE',
      reference_id: data.supplier_id || 0,
      date: data.date || new Date(),
      notes: data.notes || `Purchase/Add Stock | Price: ${data.price ?? 'N/A'}`,
    });
    return this.stockMovementRepo.save(movement);
  }

  async getRawMaterialMovements(rawMaterialId: number) {
    await this.findRawProduct(rawMaterialId);
    const movements = await this.stockMovementRepo.find({
      where: { product: { id: rawMaterialId } },
      order: { date: 'DESC' },
    });
    return movements.map((m) => ({
      id: m.id,
      date: m.date,
      type: m.type,
      quantity: m.quantity,
      price: m.notes?.includes('Price:')
        ? parseFloat(m.notes.split('Price:')[1])
        : null,
      reference:
        m.type === 'IN'
          ? m.reference_id
            ? `M-${m.reference_id}`
            : 'Manual'
          : m.reference_type,
      notes: m.notes,
    }));
  }

  async deleteStockMovement(id: number) {
    const movement = await this.stockMovementRepo.findOne({ where: { id } });
    if (!movement) throw new NotFoundException('حركة المخزون غير موجودة');

    const stock = await this.stockRepo.findOne({
      where: {
        product_id: movement.product_id,
        warehouse_id: movement.warehouse_id,
      },
    });
    if (stock) {
      if (movement.type === MovementType.IN) {
        if (Number(stock.quantity) < Number(movement.quantity))
          throw new BadRequestException(
            `رصيد غير كافٍ لحذف الحركة (المنتج: ${movement.product_id})`,
          );
        stock.quantity = Number(stock.quantity) - Number(movement.quantity);
      } else {
        stock.quantity = Number(stock.quantity) + Number(movement.quantity);
      }
      await this.stockRepo.save(stock);
    }
    return this.stockMovementRepo.delete(id);
  }

  async updateStockMovement(id: number, data: { quantity?: number; price?: number; date?: Date; notes?: string }) {
    const movement = await this.stockMovementRepo.findOne({ where: { id } });
    if (!movement) throw new NotFoundException('حركة المخزون غير موجودة');

    const oldQty = Number(movement.quantity);
    const newQty = data.quantity != null ? Number(data.quantity) : oldQty;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      const stock = await this.stockRepo.findOne({
        where: { product_id: movement.product_id, warehouse_id: movement.warehouse_id },
      });
      if (stock) {
        if (movement.type === MovementType.IN) {
          stock.quantity = Number(stock.quantity) + diff;
        } else {
          stock.quantity = Number(stock.quantity) - diff;
        }
        if (Number(stock.quantity) < 0) throw new BadRequestException('الرصيد غير كافٍ للتحديث');
        await this.stockRepo.save(stock);
      }
    }

    if (data.quantity != null) movement.quantity = data.quantity;
    if (data.date != null) movement.date = data.date;
    if (data.notes != null) movement.notes = data.notes;
    return this.stockMovementRepo.save(movement);
  }

  async createStockMovement(data: {
    rawMaterialId: number;
    type: 'IN' | 'OUT';
    quantity: number;
    price?: number;
    date: Date;
    reference?: string;
    notes?: string;
  }) {
    const product = await this.findRawProduct(data.rawMaterialId);
    const warehouseId = await this.warehouseHelper.getDefaultWarehouseId();
    let stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: product.id,
        warehouse_id: warehouseId,
        quantity: 0,
      });
    }
    if (data.type === 'IN') {
      stock.quantity = Number(stock.quantity) + Number(data.quantity);
    } else {
      if (Number(stock.quantity) < Number(data.quantity)) {
        throw new BadRequestException(
          `رصيد غير كافٍ للمادة الخام: ${product.name} (المطلوب: ${data.quantity}, المتوفر: ${stock.quantity})`,
        );
      }
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
    }
    await this.stockRepo.save(stock);

    const movement = this.stockMovementRepo.create({
      product_id: product.id,
      warehouse_id: stock.warehouse_id || warehouseId,
      type: data.type === 'IN' ? MovementType.IN : MovementType.OUT,
      quantity: data.quantity,
      reference_type: data.reference || 'MANUAL',
      reference_id: 0,
      date: data.date || new Date(),
      notes: data.notes,
    });
    return this.stockMovementRepo.save(movement);
  }

  async getAllStockMovements(filters: {
    type?: MovementType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.startDate && filters.endDate)
      where.date = Between(filters.startDate, filters.endDate);
    const movements = await this.stockMovementRepo.find({
      where,
      order: { date: 'DESC', id: 'DESC' },
      relations: ['product'],
    });
    return movements.map((m) => ({
      id: m.id,
      product_name: m.product?.name,
      date: m.date,
      quantity: m.quantity,
      type: m.type,
      price: m.notes?.includes('Price:')
        ? parseFloat(m.notes.split('Price:')[1])
        : null,
      reference: m.reference_id,
      notes: m.notes,
    }));
  }

  async recalculateRawMaterialStock(productId: number) {
    await this.findRawProduct(productId);
    const movements = await this.stockMovementRepo.find({
      where: { product: { id: productId } },
    });
    let calculatedQuantity = 0;
    for (const mov of movements) {
      if (mov.type === MovementType.IN)
        calculatedQuantity += Number(mov.quantity);
      else calculatedQuantity -= Number(mov.quantity);
    }
    let stock = await this.stockRepo.findOne({
      where: { product_id: productId },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: productId,
        warehouse_id: await this.warehouseHelper.getDefaultWarehouseId(),
        quantity: 0,
      });
    }
    stock.quantity = calculatedQuantity;
    await this.stockRepo.save(stock);
    return {
      product_id: productId,
      calculated_stock: calculatedQuantity,
      movement_count: movements.length,
    };
  }

  async exportRawMaterials() {
    const products = await this.productRepo.find({
      where: { type: 'RAW' },
      relations: ['preferred_supplier'],
    });
    const rows = products.map((p) => ({
      name: p.name,
      reorder_point: p.reorder_point,
      reorder_quantity: p.reorder_quantity,
      avg_consumption_rate: p.avg_consumption_rate,
      last_purchase_price: p.last_purchase_price,
      notes: p.notes,
    }));
    return jsonToSheetBuffer(rows, 'RawMaterials');
  }

  async importRawMaterials(data: any[]) {
    let success = 0;
    for (const row of data) {
      try {
        const normalized: Record<string, any> = {};
        for (const key of Object.keys(row)) normalized[key.trim()] = row[key];

        const name = normalized['name'] || normalized['Name'];
        if (!name) continue;
        const price =
          normalized['last_purchase_price'] ??
          normalized['Last Purchase Price'] ??
          normalized['price'] ??
          0;

        let product = await this.productRepo.findOne({
          where: { name, type: 'RAW' },
        });
        if (!product) {
          product = this.productRepo.create({
            name,
            type: 'RAW',
            unit: 'kg',
            cost_price: Number(price),
          });
          await this.productRepo.save(product);
        }

        const reorderPoint =
          normalized['reorder_point'] ?? normalized['Reorder Point'] ?? 0;
        const reorderQty =
          normalized['reorder_quantity'] ?? normalized['Reorder Quantity'] ?? 0;
        const avgCons =
          normalized['avg_consumption_rate'] ??
          normalized['Average Consumption'] ??
          0;

        await this.productRepo.update(product.id, {
          reorder_point: reorderPoint,
          reorder_quantity: reorderQty,
          avg_consumption_rate: avgCons,
          last_purchase_price: Number(price),
          cost_price: Number(price),
        });
        success++;
      } catch {
        /* skip row */
      }
    }
    return { success, failed: data.length - success };
  }
}
