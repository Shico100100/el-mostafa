import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, IsNull } from 'typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import { PeachtreeReviewService } from './peachtree-review.service';
import { StockService } from '../inventory/stock.service';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import { SyncEntity, SyncResultDto, SyncStatus } from './dto/sync-status.dto';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder, OrderStatus } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';

interface MappedCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
}

interface MappedSupplier {
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
}

interface MappedProduct {
  name: string;
  sku: string;
  barcode: string;
  cost_price: number;
  selling_price: number;
  unit: string;
  description: string;
  type: string;
}

const BATCH_SIZE = 500;

export interface SyncContext {
  shouldSkip(entity: string, peachtreeCount: number): boolean;
  markSynced(entity: string, count: number): void;
}

@Injectable()
export class PeachtreeSyncMasterService {
  private readonly logger = new Logger(PeachtreeSyncMasterService.name);

  constructor(
    private connectionService: PeachtreeConnectionService,
    private mappingService: PeachtreeMappingService,
    private reviewService: PeachtreeReviewService,
    private stockService: StockService,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepo: Repository<SalesOrderItem>,
  ) {}

  async syncCustomers(
    result: SyncResultDto,
    runId: string,
    ctx: SyncContext,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.CUSTOMERS);

    const rows = await this.connectionService.query('Customers');
    if (ctx.shouldSkip(SyncEntity.CUSTOMERS, rows.length)) {
      result.recordsSkipped = rows.length;
      result.recordsProcessed = rows.length;
      return;
    }

    const mapped = rows
      .map((r) => this.mappingService.mapCustomer(r))
      .filter((m) => m.name);

    const names = mapped.map((m) => m.name);
    const existing = await this.customerRepo.find({
      where: { name: In(names) },
      select: ['id', 'name', 'phone', 'email', 'address', 'balance'],
    });
    const existingMap = new Map(existing.map((e) => [e.name, e]));

    const toInsert: MappedCustomer[] = [];
    for (const m of mapped) {
      const existingRec = existingMap.get(m.name);
      if (!existingRec) {
        toInsert.push(m);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.CUSTOMERS,
          action: SyncLogAction.INSERTED,
          recordKey: m.name,
        });
        continue;
      }
      const oldObj = {
        phone: existingRec.phone || '',
        email: existingRec.email || '',
        address: existingRec.address || '',
        balance: Number(existingRec.balance) || 0,
      };
      const newObj = {
        phone: m.phone || '',
        email: m.email || '',
        address: m.address || '',
        balance: m.balance,
      };
      const changes = this.reviewService.computeDiff(oldObj, newObj);
      if (changes.length === 0) {
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.CUSTOMERS,
          action: SyncLogAction.SKIPPED,
          recordKey: m.name,
        });
        result.recordsSkipped++;
      } else {
        await this.reviewService.createReview({
          entity: SyncEntity.CUSTOMERS,
          recordKey: m.name,
          changeType: 'update',
          dbRecordId: existingRec.id,
          oldValues: oldObj,
          newValues: newObj,
        });
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.CUSTOMERS,
          action: SyncLogAction.DIFFERENT,
          recordKey: m.name,
          changes,
        });
        result.recordsUpdated++;
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.customerRepo
        .createQueryBuilder()
        .insert()
        .into(Customer)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;
    result.recordsProcessed = rows.length;
    ctx.markSynced(SyncEntity.CUSTOMERS, rows.length);
  }

  async syncSuppliers(
    result: SyncResultDto,
    runId: string,
    ctx: SyncContext,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.SUPPLIERS);

    const rows = await this.connectionService.query('Vendors');
    if (ctx.shouldSkip(SyncEntity.SUPPLIERS, rows.length)) {
      result.recordsSkipped = rows.length;
      result.recordsProcessed = rows.length;
      return;
    }

    const mapped = rows
      .map((r) => this.mappingService.mapSupplier(r))
      .filter((m) => m.name);

    const names = mapped.map((m) => m.name);
    const existing = await this.supplierRepo.find({
      where: { name: In(names) },
      select: ['id', 'name', 'phone', 'email', 'address', 'balance'],
    });
    const existingMap = new Map(existing.map((e) => [e.name, e]));

    const toInsert: MappedSupplier[] = [];
    for (const m of mapped) {
      const existingRec = existingMap.get(m.name);
      if (!existingRec) {
        toInsert.push(m);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.SUPPLIERS,
          action: SyncLogAction.INSERTED,
          recordKey: m.name,
        });
        continue;
      }
      const oldObj = {
        phone: existingRec.phone || '',
        email: existingRec.email || '',
        address: existingRec.address || '',
        balance: Number(existingRec.balance) || 0,
      };
      const newObj = {
        phone: m.phone || '',
        email: m.email || '',
        address: m.address || '',
        balance: m.balance,
      };
      const changes = this.reviewService.computeDiff(oldObj, newObj);
      if (changes.length === 0) {
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.SUPPLIERS,
          action: SyncLogAction.SKIPPED,
          recordKey: m.name,
        });
        result.recordsSkipped++;
      } else {
        await this.reviewService.createReview({
          entity: SyncEntity.SUPPLIERS,
          recordKey: m.name,
          changeType: 'update',
          dbRecordId: existingRec.id,
          oldValues: oldObj,
          newValues: newObj,
        });
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.SUPPLIERS,
          action: SyncLogAction.DIFFERENT,
          recordKey: m.name,
          changes,
        });
        result.recordsUpdated++;
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.supplierRepo
        .createQueryBuilder()
        .insert()
        .into(Supplier)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;
    result.recordsProcessed = rows.length;
    ctx.markSynced(SyncEntity.SUPPLIERS, rows.length);
  }

  async syncProducts(
    result: SyncResultDto,
    runId: string,
    ctx: SyncContext,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.PRODUCTS);

    const rows = await this.connectionService.query('LineItem');
    if (ctx.shouldSkip(SyncEntity.PRODUCTS, rows.length)) {
      result.recordsSkipped = rows.length;
      result.recordsProcessed = rows.length;
      return;
    }

    const mapped = rows
      .map((r) => this.mappingService.mapProduct(r))
      .filter((m) => m.name);

    const skus = mapped.map((m) => m.sku).filter(Boolean);
    const names = mapped.map((m) => m.name);
    const existing = await this.productRepo.find({
      where: [{ sku: In(skus) }, { name: In(names) }],
      select: [
        'id',
        'name',
        'sku',
        'cost_price',
        'selling_price',
        'unit',
        'description',
        'type',
      ],
    });
    const bySku = new Map<string, Product>();
    const byName = new Map<string, Product>();
    for (const p of existing) {
      if (p.sku && !bySku.has(p.sku)) bySku.set(p.sku, p);
      if (p.name && !byName.has(p.name)) byName.set(p.name, p);
    }

    const toInsert: MappedProduct[] = [];
    for (const m of mapped) {
      const existingRec = (m.sku && bySku.get(m.sku)) || byName.get(m.name);
      if (!existingRec) {
        toInsert.push(m);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.PRODUCTS,
          action: SyncLogAction.INSERTED,
          recordKey: m.sku || m.name,
        });
        continue;
      }
      const oldObj = {
        name: existingRec.name,
        sku: existingRec.sku || '',
        cost_price: Number(existingRec.cost_price) || 0,
        selling_price: Number(existingRec.selling_price) || 0,
        unit: existingRec.unit || '',
        description: existingRec.description || '',
        type: existingRec.type || '',
      };
      const newObj = {
        name: m.name,
        sku: m.sku || '',
        cost_price: m.cost_price,
        selling_price: m.selling_price,
        unit: m.unit || '',
        description: m.description || '',
        type: m.type || '',
      };
      const changes = this.reviewService.computeDiff(oldObj, newObj);
      if (changes.length === 0) {
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.PRODUCTS,
          action: SyncLogAction.SKIPPED,
          recordKey: m.sku || m.name,
        });
        result.recordsSkipped++;
      } else {
        await this.reviewService.createReview({
          entity: SyncEntity.PRODUCTS,
          recordKey: m.sku || m.name,
          changeType: 'update',
          dbRecordId: existingRec.id,
          oldValues: oldObj,
          newValues: newObj,
        });
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.PRODUCTS,
          action: SyncLogAction.DIFFERENT,
          recordKey: m.sku || m.name,
          changes,
        });
        result.recordsUpdated++;
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.productRepo
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;
    result.recordsProcessed = rows.length;
    ctx.markSynced(SyncEntity.PRODUCTS, rows.length);
  }

  async deliverSyncSalesOrders(runId: string): Promise<SyncResultDto> {
    const result: SyncResultDto = {
      entity: SyncEntity.SALES_INVOICES,
      status: SyncStatus.COMPLETED,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
    };

    const orders = await this.salesOrderRepo.find({
      where: {
        notes: Like('[PQ-%'),
        status: OrderStatus.COMPLETED,
        delivered_at: IsNull(),
      },
      select: ['id'],
    });

    for (const order of orders) {
      try {
        await this.deliverSingleOrder(order.id, runId, result);
      } catch (error: unknown) {
        result.errors.push(
          `deliver order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (result.errors.length > 0) result.status = SyncStatus.FAILED;
    return result;
  }

  async deliverSingleOrder(
    orderId: number,
    runId: string,
    result?: SyncResultDto,
  ): Promise<void> {
    const order = await this.salesOrderRepo.findOne({
      where: { id: orderId },
    });
    if (!order) return;
    if (
      order.status !== OrderStatus.COMPLETED ||
      order.delivered_at ||
      !order.notes?.startsWith('[PQ-')
    ) {
      return;
    }

    const items = await this.salesOrderItemRepo.find({
      where: { order_id: order.id },
    });
    const warehouseId = await this.stockService.getDefaultWarehouseId();
    for (const item of items) {
      await this.stockService.addStockMovement(
        {
          product_id: item.product_id,
          warehouse_id: warehouseId,
          type: MovementType.OUT,
          quantity: Number(item.quantity),
          notes: `تسليم - فاتورة ${order.invoice_number || order.id}`,
        },
        undefined,
        true,
      );
    }
    await this.salesOrderRepo.update(order.id, { delivered_at: new Date() });
    if (result) result.recordsProcessed++;
    await this.reviewService.log({
      runId,
      triggeredBy: 'manual',
      entity: SyncEntity.SALES_INVOICES,
      action: SyncLogAction.UPDATED,
      recordKey: order.invoice_number || String(order.id),
      changes: [
        { field: 'delivery', old: 'pending', new: 'delivered' },
        { field: 'items_delivered', old: 0, new: items.length },
      ],
    });
  }
}
