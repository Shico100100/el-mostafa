import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, IsNull } from 'typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import {
  SyncEntity,
  SyncResultDto,
  SyncStatus,
  SyncStatusResponseDto,
} from './dto/sync-status.dto';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder, OrderStatus } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { PeachtreeReviewService } from './peachtree-review.service';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
import { StockService } from '../inventory/stock.service';
import { MovementType } from '../inventory/entities/stock-movement.entity';

const BATCH_SIZE = 500;
const SKIP_IF_SYNCED_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PeachtreeSyncService {
  private readonly logger = new Logger(PeachtreeSyncService.name);
  private syncHistory: SyncStatusResponseDto[] = [];
  private lastSyncPerEntity = new Map<string, number>();
  private lastSyncCounts = new Map<string, number>();
  private currentSync: SyncStatusResponseDto | null = null;

  constructor(
    private connectionService: PeachtreeConnectionService,
    private mappingService: PeachtreeMappingService,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
    private reviewService: PeachtreeReviewService,
    private stockService: StockService,
  ) {}

  async runSync(
    triggeredBy = 'manual',
    mode: 'full' | 'incremental' = 'full',
  ): Promise<SyncStatusResponseDto> {
    const syncId = `sync_${Date.now()}`;
    const syncStatus: SyncStatusResponseDto = {
      id: syncId,
      startedAt: new Date(),
      status: SyncStatus.RUNNING,
      triggeredBy,
      results: [],
      currentEntity: '',
      percentComplete: 0,
    };

    this.currentSync = syncStatus;
    this.logger.log(`Starting sync ${syncId} (mode: ${mode})`);

    this.connectionService.enableCache();

    this.logger.log(
      `Sync ${syncId} started (mode: ${mode}) — no deletions, differences routed to review`,
    );

    const entities = [
      SyncEntity.CUSTOMERS,
      SyncEntity.SUPPLIERS,
      SyncEntity.PRODUCTS,
      SyncEntity.SALES_INVOICES,
      SyncEntity.PURCHASE_INVOICES,
      SyncEntity.INVOICE_LINE_ITEMS,
    ];

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      syncStatus.currentEntity = entity;
      syncStatus.percentComplete = Math.round((i / entities.length) * 100);

      try {
        const result = await this.syncEntity(entity, syncId);
        syncStatus.results.push(result);
      } catch (error) {
        syncStatus.results.push({
          entity,
          status: SyncStatus.FAILED,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: [error.message || String(error)],
        });
      }
    }

    const deliveryResult = await this.deliverSyncSalesOrders(syncId);
    syncStatus.results.push(deliveryResult);

    syncStatus.percentComplete = 100;
    syncStatus.currentEntity = '';
    syncStatus.completedAt = new Date();
    syncStatus.status = syncStatus.results.some(
      (r) => r.status === SyncStatus.FAILED,
    )
      ? SyncStatus.FAILED
      : SyncStatus.COMPLETED;

    syncStatus.records_synced = syncStatus.results.reduce(
      (sum, r) => sum + r.recordsCreated + r.recordsUpdated,
      0,
    );
    syncStatus.duration_ms =
      syncStatus.completedAt.getTime() - syncStatus.startedAt.getTime();

    this.syncHistory.unshift(syncStatus);
    if (this.syncHistory.length > 50)
      this.syncHistory = this.syncHistory.slice(0, 50);

    this.logger.log(
      `Sync ${syncId} completed with status: ${syncStatus.status} in ${syncStatus.duration_ms}ms`,
    );
    this.connectionService.disableCache();
    return syncStatus;
  }

  async runSyncPartial(
    entities: SyncEntity[],
    triggeredBy = 'manual',
  ): Promise<SyncStatusResponseDto> {
    const syncId = `sync_${Date.now()}`;
    const syncStatus: SyncStatusResponseDto = {
      id: syncId,
      startedAt: new Date(),
      status: SyncStatus.RUNNING,
      triggeredBy,
      results: [],
      currentEntity: '',
      percentComplete: 0,
    };

    this.currentSync = syncStatus;
    this.logger.log(
      `Starting partial sync ${syncId} for: ${entities.join(', ')}`,
    );

    this.connectionService.enableCache();

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      syncStatus.currentEntity = entity;
      syncStatus.percentComplete = Math.round((i / entities.length) * 100);

      try {
        const result = await this.syncEntity(entity, syncId);
        syncStatus.results.push(result);
      } catch (error) {
        syncStatus.results.push({
          entity,
          status: SyncStatus.FAILED,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: [error.message || String(error)],
        });
      }
    }

    if (
      entities.includes(SyncEntity.SALES_INVOICES) ||
      entities.includes(SyncEntity.INVOICE_LINE_ITEMS)
    ) {
      const deliveryResult = await this.deliverSyncSalesOrders(syncId);
      syncStatus.results.push(deliveryResult);
    }

    syncStatus.percentComplete = 100;
    syncStatus.currentEntity = '';
    syncStatus.completedAt = new Date();
    syncStatus.status = syncStatus.results.some(
      (r) => r.status === SyncStatus.FAILED,
    )
      ? SyncStatus.FAILED
      : SyncStatus.COMPLETED;

    syncStatus.records_synced = syncStatus.results.reduce(
      (sum, r) => sum + r.recordsCreated + r.recordsUpdated,
      0,
    );
    syncStatus.duration_ms =
      syncStatus.completedAt.getTime() - syncStatus.startedAt.getTime();

    this.syncHistory.unshift(syncStatus);
    if (this.syncHistory.length > 50)
      this.syncHistory = this.syncHistory.slice(0, 50);

    this.logger.log(
      `Partial sync ${syncId} completed: ${syncStatus.status} in ${syncStatus.duration_ms}ms`,
    );
    this.connectionService.disableCache();
    return syncStatus;
  }

  private async deliverSyncSalesOrders(runId: string): Promise<SyncResultDto> {
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
      } catch (error: any) {
        result.errors.push(
          `deliver order ${order.id}: ${error?.message || String(error)}`,
        );
      }
    }

    if (result.errors.length > 0) result.status = SyncStatus.FAILED;
    return result;
  }

  private async deliverSingleOrder(
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

  private async syncEntity(
    entity: SyncEntity,
    runId: string,
  ): Promise<SyncResultDto> {
    const result: SyncResultDto = {
      entity,
      status: SyncStatus.RUNNING,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
    };

    try {
      switch (entity) {
        case SyncEntity.CUSTOMERS:
          await this.syncCustomers(result, runId);
          break;
        case SyncEntity.SUPPLIERS:
          await this.syncSuppliers(result, runId);
          break;
        case SyncEntity.PRODUCTS:
          await this.syncProducts(result, runId);
          break;
        case SyncEntity.SALES_INVOICES:
          await this.syncSalesInvoices(result, runId);
          break;
        case SyncEntity.PURCHASE_INVOICES:
          await this.syncPurchaseInvoices(result, runId);
          break;
        case SyncEntity.INVOICE_LINE_ITEMS:
          await this.syncInvoiceLineItems(result, runId);
          break;
      }
      result.status = SyncStatus.COMPLETED;
    } catch (error) {
      result.status = SyncStatus.FAILED;
      result.errors.push(error.message || String(error));
    }

    return result;
  }

  private shouldSkip(entity: string, peachtreeCount: number): boolean {
    const lastTime = this.lastSyncPerEntity.get(entity);
    const lastCount = this.lastSyncCounts.get(entity);
    if (!lastTime) return false;
    if (Date.now() - lastTime > SKIP_IF_SYNCED_MS) return false;
    if (lastCount !== undefined && lastCount === peachtreeCount) {
      this.logger.log(
        `Skipping ${entity}: unchanged (${peachtreeCount} records, synced ${Math.round((Date.now() - lastTime) / 1000)}s ago)`,
      );
      return true;
    }
    return false;
  }

  private markSynced(entity: string, count: number) {
    this.lastSyncPerEntity.set(entity, Date.now());
    this.lastSyncCounts.set(entity, count);
  }

  private async compareOrderToReview(
    entity: SyncEntity,
    existing: {
      id: number;
      total_amount: number;
      status: string;
      order_date: Date | null;
      notes?: string | null;
    },
    newOrder: {
      total_amount: number;
      status: string;
      order_date?: Date | null;
      notes?: string;
    },
    recordKey: string,
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    const oldObj = {
      total_amount: Number(existing.total_amount) || 0,
      status: existing.status,
      order_date: existing.order_date
        ? existing.order_date instanceof Date
          ? existing.order_date.toISOString()
          : String(existing.order_date)
        : '',
      notes: existing.notes || '',
    };
    const newObj = {
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      order_date: newOrder.order_date
        ? newOrder.order_date instanceof Date
          ? newOrder.order_date.toISOString()
          : String(newOrder.order_date)
        : '',
      notes: newOrder.notes || '',
    };
    const changes = this.reviewService.computeDiff(oldObj, newObj);
    if (changes.length === 0) {
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.SKIPPED,
        recordKey,
      });
      result.recordsSkipped++;
    } else {
      await this.reviewService.createReview({
        entity,
        recordKey,
        changeType: 'update',
        dbRecordId: existing.id,
        oldValues: oldObj,
        newValues: newObj,
      });
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.DIFFERENT,
        recordKey,
        changes,
      });
      result.recordsUpdated++;
    }
  }

  private async flagMissingOrders(
    entity: SyncEntity,
    module: string,
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    const repo =
      entity === SyncEntity.SALES_INVOICES
        ? this.salesOrderRepo
        : this.purchaseOrderRepo;
    const pqOrders = await repo.find({
      where: { notes: Like('[PQ-%') },
      select: ['id', 'notes'],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const headers = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr missing-check (${module}): ${e.message}`);
        return [];
      });
    const keys = new Set<string>();
    for (const h of headers) {
      if (String(h.Module).trim() === module) {
        keys.add(
          `${h.JrnlKey_TrxNumber}_${h.JrnlKey_Per}_${h.JrnlKey_Journal}`,
        );
      }
    }
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (!m) continue;
      const key = `${m[1]}_${m[2]}_${m[3]}`;
      if (keys.has(key)) continue;
      await this.reviewService.createReview({
        entity,
        recordKey: o.notes,
        changeType: 'missing',
        dbRecordId: o.id,
        oldValues: { notes: o.notes },
        newValues: {},
      });
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.MISSING,
        recordKey: o.notes,
      });
      result.recordsSkipped++;
    }
  }

  private buildExpectedItems(
    rows: any[],
    orderId: number,
    recordToProduct: Map<number, number>,
  ): any[] {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    // Step 1: collapse the 3x GL distribution rows (7/23/27) into one logical
    // line per (ItemRecordNumber, Quantity, price), keeping the max amount.
    const lines = new Map<
      string,
      { productId: number; qty: number; price: number; amt: number }
    >();
    for (const row of rows) {
      const recNo = parseInt(row.ItemRecordNumber, 10);
      const productId = recordToProduct.get(recNo) || 0;
      if (!productId) continue;
      let qty = Math.abs(parseFloat(row.Quantity || '0') || 0);
      const price = Math.abs(parseFloat(row.UnitCost || '0') || 0);
      let amt = Math.abs(parseFloat(row.Amount || '0') || 0);
      if (qty <= 0 && amt > 0 && price > 0) qty = amt / price;
      qty = Math.round(qty * 10000) / 10000;
      amt = round2(amt);
      if (qty <= 0 && amt <= 0) continue;
      const lineKey = `${recNo}_${qty}_${price}`;
      const existing = lines.get(lineKey);
      if (existing) {
        if (amt > existing.amt) existing.amt = amt;
        continue;
      }
      lines.set(lineKey, { productId, qty, price, amt });
    }
    // Step 2: aggregate duplicate product lines by product (summing quantities
    // and amounts) — the DB enforces one line per (order_id, product_id), so
    // Peachtree lines that share a product (even at different prices) collapse
    // into a single line. A single-line product keeps its exact price; merged
    // lines use the amount-weighted price so the stored total stays exact.
    const groups = new Map<
      number,
      {
        product_id: number;
        quantity: number;
        total: number;
        price: number;
        n: number;
      }
    >();
    for (const line of lines.values()) {
      const existing = groups.get(line.productId);
      if (existing) {
        existing.quantity = round2(existing.quantity + line.qty);
        existing.total = round2(existing.total + line.amt);
        existing.n++;
        continue;
      }
      groups.set(line.productId, {
        product_id: line.productId,
        quantity: line.qty || 1,
        total: line.amt || round2(line.qty * line.price),
        price: line.price,
        n: 1,
      });
    }
    return [...groups.values()].map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      total: item.total,
      price:
        item.n > 1
          ? round2(item.quantity > 0 ? item.total / item.quantity : 0)
          : round2(item.price || 0),
    }));
  }

  private itemsEqual(a: any[], b: any[]): boolean {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const norm = (list: any[]) =>
      list
        .map((i) => ({
          product_id: i.product_id,
          quantity: round2(Number(i.quantity) || 0),
          price: round2(Number(i.price) || 0),
          total: round2(Number(i.total) || 0),
        }))
        .sort(
          (x, y) =>
            x.product_id - y.product_id ||
            x.quantity - y.quantity ||
            x.price - y.price,
        );
    return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
  }

  private async syncCustomers(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.CUSTOMERS);

    const rows = await this.connectionService.query('Customers');
    if (this.shouldSkip(SyncEntity.CUSTOMERS, rows.length)) {
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

    const toInsert: any[] = [];
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
    this.markSynced(SyncEntity.CUSTOMERS, rows.length);
  }

  private async syncSuppliers(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.SUPPLIERS);

    const rows = await this.connectionService.query('Vendors');
    if (this.shouldSkip(SyncEntity.SUPPLIERS, rows.length)) {
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

    const toInsert: any[] = [];
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
    this.markSynced(SyncEntity.SUPPLIERS, rows.length);
  }

  private async syncProducts(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.PRODUCTS);

    const rows = await this.connectionService.query('LineItem');
    if (this.shouldSkip(SyncEntity.PRODUCTS, rows.length)) {
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

    const toInsert: any[] = [];
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
    this.markSynced(SyncEntity.PRODUCTS, rows.length);
  }

  private async syncSalesInvoices(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.SALES_INVOICES);

    const rows = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_Partner, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, TransactionDate, Description, MainAmount, Reference, TrxIsPosted, CustVendId, PaymentMethod, AmountPaid, CustomerInvoiceNo, TrxName',
        "Module = 'R'",
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr sales query: ${e.message}`);
        return [];
      });

    if (rows.length === 0) {
      this.logger.log('No sales invoices found');
      return;
    }

    const customers = await this.customerRepo.find({
      select: ['id', 'name'],
    });
    const customerByName = new Map<string, number>();
    for (const c of customers) customerByName.set(c.name, c.id);

    const ptCustomers = await this.connectionService
      .query(
        'Customers',
        0,
        'CustomerRecordNumber, Customer_Bill_Name, CustomerID',
      )
      .catch((e) => {
        this.logger.warn(`Customers query: ${e.message}`);
        return [];
      });
    const custVendToCustomer = new Map<number, number>();
    for (const ptCust of ptCustomers) {
      const recNo = parseInt(ptCust.CustomerRecordNumber, 10);
      const name = ptCust.Customer_Bill_Name || ptCust.CustomerID || '';
      const dbId = customerByName.get(name) || 0;
      if (recNo > 0 && dbId > 0) custVendToCustomer.set(recNo, dbId);
    }
    this.logger.log(
      `Customer mapping: ${custVendToCustomer.size} Peachtree→DB links, ${rows.length} sales headers`,
    );

    const toCompare: {
      key: string;
      invNum: string;
      data: any;
    }[] = [];
    const seen = new Set<string>();
    for (const hdr of rows) {
      const mapped = this.mappingService.mapSalesInvoice(hdr);
      const custRecNo = mapped.customer_vend_id;
      let customerId = custVendToCustomer.get(custRecNo) || 0;
      if (!customerId) {
        const custName = hdr.Description || hdr.TrxName || '';
        if (custName) customerId = customerByName.get(custName) || 0;
      }
      if (!customerId) {
        result.recordsSkipped++;
        continue;
      }

      const uniqueKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const invNum = String(
        mapped.invoice_number || hdr.JrnlKey_TrxNumber || '',
      );
      if (seen.has(uniqueKey)) {
        result.recordsSkipped++;
        continue;
      }
      seen.add(uniqueKey);
      toCompare.push({
        key: uniqueKey,
        invNum,
        data: {
          customer_id: customerId,
          total_amount: mapped.total_amount,
          status:
            mapped.status === 'COMPLETED'
              ? OrderStatus.COMPLETED
              : OrderStatus.PENDING,
          order_date: mapped.order_date || undefined,
          notes: `[PQ-${uniqueKey}] ${mapped.notes}`,
          invoice_number: invNum,
        },
      });
    }

    const invNumbers = toCompare
      .map((c) => c.invNum)
      .filter(Boolean);
    const existingByInv = new Map<string, SalesOrder>();
    if (invNumbers.length > 0) {
      const existing = await this.salesOrderRepo.find({
        where: { invoice_number: In(invNumbers) },
        select: ['id', 'invoice_number', 'total_amount', 'status', 'order_date', 'notes'],
      });
      for (const o of existing) existingByInv.set(o.invoice_number!, o);
    }
    const pqOrders = await this.salesOrderRepo.find({
      where: { notes: Like('[PQ-%') },
      select: ['id', 'invoice_number', 'notes', 'total_amount', 'status', 'order_date'],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const existingByPq = new Map<string, SalesOrder>();
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) existingByPq.set(`${m[1]}_${m[2]}_${m[3]}`, o);
    }

    const toInsert: any[] = [];
    for (const c of toCompare) {
      const existing = existingByInv.get(c.invNum) || existingByPq.get(c.key);
      if (!existing) {
        toInsert.push(c.data);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.SALES_INVOICES,
          action: SyncLogAction.INSERTED,
          recordKey: c.invNum || c.key,
        });
        result.recordsProcessed++;
      } else {
        await this.compareOrderToReview(
          SyncEntity.SALES_INVOICES,
          existing,
          c.data,
          c.invNum || c.key,
          result,
          runId,
        );
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.salesOrderRepo
        .createQueryBuilder()
        .insert()
        .into(SalesOrder)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;

    await this.flagMissingOrders(SyncEntity.SALES_INVOICES, 'R', result, runId);

    this.logger.log(
      `Sales invoices: ${result.recordsCreated} created, ${result.recordsUpdated} differences, ${result.recordsSkipped} skipped`,
    );
  }

  private async syncPurchaseInvoices(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.PURCHASE_INVOICES);

    const rows = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_Partner, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, TransactionDate, Description, MainAmount, Reference, TrxIsPosted, CustVendId, PaymentMethod, AmountPaid, TrxName',
        "Module = 'P'",
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr purchase query: ${e.message}`);
        return [];
      });

    if (rows.length === 0) {
      this.logger.log('No purchase invoices found');
      return;
    }

    const suppliers = await this.supplierRepo.find({
      select: ['id', 'name'],
    });
    const supplierByName = new Map<string, number>();
    for (const s of suppliers) supplierByName.set(s.name, s.id);

    const ptVendors = await this.connectionService
      .query('Vendors', 0, 'VendorRecordNumber, Name, VendorID')
      .catch((e) => {
        this.logger.warn(`Vendors query: ${e.message}`);
        return [];
      });
    const custVendToSupplier = new Map<number, number>();
    for (const ptVend of ptVendors) {
      const recNo = parseInt(ptVend.VendorRecordNumber, 10);
      const name = ptVend.Name || ptVend.VendorID || '';
      const dbId = supplierByName.get(name) || 0;
      if (recNo > 0 && dbId > 0) custVendToSupplier.set(recNo, dbId);
    }
    this.logger.log(
      `Supplier mapping: ${custVendToSupplier.size} Peachtree→DB links, ${rows.length} purchase headers`,
    );

    const toCompare: {
      key: string;
      invNum: string;
      data: any;
    }[] = [];
    const seen = new Set<string>();
    for (const hdr of rows) {
      const mapped = this.mappingService.mapPurchaseInvoice(hdr);
      const vendRecNo = mapped.customer_vend_id;
      let supplierId = custVendToSupplier.get(vendRecNo) || 0;
      if (!supplierId) {
        const vendName = hdr.Description || hdr.TrxName || '';
        if (vendName) supplierId = supplierByName.get(vendName) || 0;
      }
      if (!supplierId) {
        result.recordsSkipped++;
        continue;
      }

      const uniqueKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const invNum = String(
        mapped.invoice_number || hdr.JrnlKey_TrxNumber || '',
      );
      if (seen.has(uniqueKey)) {
        result.recordsSkipped++;
        continue;
      }
      seen.add(uniqueKey);
      toCompare.push({
        key: uniqueKey,
        invNum,
        data: {
          supplier_id: supplierId,
          total_amount: mapped.total_amount,
          status:
            mapped.status === 'COMPLETED'
              ? PurchaseOrderStatus.COMPLETED
              : PurchaseOrderStatus.PENDING,
          order_date: mapped.order_date || undefined,
          notes: `[PQ-${uniqueKey}] ${mapped.notes}`,
          invoice_number: invNum,
        },
      });
    }

    const invNumbers = toCompare
      .map((c) => c.invNum)
      .filter(Boolean);
    const existingByInv = new Map<string, PurchaseOrder>();
    if (invNumbers.length > 0) {
      const existing = await this.purchaseOrderRepo.find({
        where: { invoice_number: In(invNumbers) },
        select: ['id', 'invoice_number', 'total_amount', 'status', 'order_date', 'notes'],
      });
      for (const o of existing) existingByInv.set(o.invoice_number!, o);
    }
    const pqOrders = await this.purchaseOrderRepo.find({
      where: { notes: Like('[PQ-%') },
      select: ['id', 'invoice_number', 'notes', 'total_amount', 'status', 'order_date'],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const existingByPq = new Map<string, PurchaseOrder>();
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) existingByPq.set(`${m[1]}_${m[2]}_${m[3]}`, o);
    }

    const toInsert: any[] = [];
    for (const c of toCompare) {
      const existing = existingByInv.get(c.invNum) || existingByPq.get(c.key);
      if (!existing) {
        toInsert.push(c.data);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.PURCHASE_INVOICES,
          action: SyncLogAction.INSERTED,
          recordKey: c.invNum || c.key,
        });
        result.recordsProcessed++;
      } else {
        await this.compareOrderToReview(
          SyncEntity.PURCHASE_INVOICES,
          existing,
          c.data,
          c.invNum || c.key,
          result,
          runId,
        );
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.purchaseOrderRepo
        .createQueryBuilder()
        .insert()
        .into(PurchaseOrder)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;

    await this.flagMissingOrders(
      SyncEntity.PURCHASE_INVOICES,
      'P',
      result,
      runId,
    );

    this.logger.log(
      `Purchase invoices: ${result.recordsCreated} created, ${result.recordsUpdated} differences, ${result.recordsSkipped} skipped`,
    );
  }

  private async syncInvoiceLineItems(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(
      SyncEntity.INVOICE_LINE_ITEMS,
    );

    const jrnlRowFields =
      'PostOrder, CustomerRecordNumber, VendorRecordNumber, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber, RowDescription';

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    const productByFuzzy = new Map<string, number>();

    const normalizeArabic = (text: string): string => {
      return text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const STRIP_PREFIXES = ['علب', 'علبه', 'كرتون', 'كرتونة'];
    const stripPrefix = (text: string): string => {
      let t = normalizeArabic(text);
      for (const prefix of STRIP_PREFIXES) {
        if (t.startsWith(prefix + ' ')) {
          t = t.substring(prefix.length).trim();
          break;
        }
      }
      return t;
    };

    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
      const stripped = stripPrefix(p.name);
      if (stripped && !productByFuzzy.has(stripped)) {
        productByFuzzy.set(stripped, p.id);
      }
    }

    const recordToProduct = new Map<number, number>();
    const lineItems = await this.connectionService
      .query('LineItem')
      .catch((e) => {
        this.logger.warn(`LineItem query: ${e.message}`);
        return [];
      });
    let matchedCount = 0;

    for (const li of lineItems) {
      const recNo = parseInt(li.ItemRecordNumber, 10);
      if (isNaN(recNo) || recNo <= 0) continue;
      const desc = li.ItemDescription || '';
      const itemId = li.ItemID || '';

      let pid = li.UPC_SKU
        ? productBySku.get(normalizeArabic(li.UPC_SKU)) || 0
        : 0;
      if (!pid && desc) pid = productByName.get(normalizeArabic(desc)) || 0;
      if (!pid && desc) {
        const stripped = stripPrefix(desc);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && desc) {
        const normDesc = normalizeArabic(desc);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normDesc.includes(normName) || normName.includes(normDesc))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (!pid && itemId) {
        pid = productByName.get(normalizeArabic(itemId)) || 0;
      }
      if (!pid && itemId) {
        const stripped = stripPrefix(itemId);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && itemId) {
        const normItemId = normalizeArabic(itemId);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normItemId.includes(normName) || normName.includes(normItemId))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (pid) {
        recordToProduct.set(recNo, pid);
        matchedCount++;
      }
    }

    this.logger.log(
      `Product mapping: ${matchedCount} matched from ${lineItems.length} LineItems`,
    );

    // --- Build PostOrder → orderId maps using JrnlHdr ---
    // Parse order notes format: [PQ-{TrxNumber}_{Per}_{Journal}] ...
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const salesOrders = await this.salesOrderRepo.find({
      select: ['id', 'notes'],
    });
    const purchaseOrders = await this.purchaseOrderRepo.find({
      select: ['id', 'notes'],
    });

    // Extract TrxNumber+Per+Journal from each order's notes
    const salesOrderPqKeys = new Map<string, number>(); // "TrxNumber_Per_Journal" → orderId
    const purchaseOrderPqKeys = new Map<string, number>();
    for (const o of salesOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) salesOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    for (const o of purchaseOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) purchaseOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }

    this.logger.log(
      `Orders: ${salesOrders.length} sales (${salesOrderPqKeys.size} with PQ keys), ${purchaseOrders.length} purchase (${purchaseOrderPqKeys.size} with PQ keys)`,
    );

    // Query all JrnlHdr to build PostOrder → orderId mapping
    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr all: ${e.message}`);
        return [];
      });

    const postOrderToSalesOrderId = new Map<number, number>();
    const postOrderToPurchaseOrderId = new Map<number, number>();
    let salesHeadersMatched = 0;
    let purchaseHeadersMatched = 0;

    for (const hdr of allHeaders) {
      const postOrder = parseInt(hdr.PostOrder, 10);
      if (isNaN(postOrder) || postOrder <= 0) continue;
      const trxNum = hdr.JrnlKey_TrxNumber;
      const per = hdr.JrnlKey_Per;
      const journal = hdr.JrnlKey_Journal;
      const module = String(hdr.Module || '').trim();
      const pqKey = `${trxNum}_${per}_${journal}`;

      if (module === 'R') {
        const orderId = salesOrderPqKeys.get(pqKey);
        if (orderId) {
          postOrderToSalesOrderId.set(postOrder, orderId);
          salesHeadersMatched++;
        }
      } else if (module === 'P') {
        const orderId = purchaseOrderPqKeys.get(pqKey);
        if (orderId) {
          postOrderToPurchaseOrderId.set(postOrder, orderId);
          purchaseHeadersMatched++;
        }
      }
    }

    this.logger.log(
      `PostOrder mapping: ${salesHeadersMatched} sales headers, ${purchaseHeadersMatched} purchase headers matched to DB orders`,
    );

    const existingSalesItems = await this.salesOrderItemRepo.find({
      select: ['order_id', 'product_id', 'quantity', 'price', 'total'],
    });
    const existingPurchaseItems = await this.purchaseOrderItemRepo.find({
      select: ['order_id', 'product_id', 'quantity', 'price', 'total'],
    });
    const salesOrderHasItems = new Set<number>(
      existingSalesItems.map((i) => i.order_id),
    );
    const purchaseOrderHasItems = new Set<number>(
      existingPurchaseItems.map((i) => i.order_id),
    );

    // --- Query JrnlRow (no WHERE — Pervasive WHERE clause silently fails) ---
    const allRawRows = await this.connectionService
      .query('JrnlRow', 0, jrnlRowFields)
      .catch((e) => {
        this.logger.warn(`JrnlRow query: ${e.message}`);
        return [];
      });

    const glAccountSet = new Set([0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55]);
    const allRows = allRawRows.filter((r: any) => {
      const itemRec = parseInt(r.ItemRecordNumber, 10);
      const glAcnt = parseInt(r.GLAcntNumber, 10);
      return itemRec > 0 && glAccountSet.has(glAcnt);
    });
    this.logger.log(
      `JrnlRow: ${allRawRows.length} total, ${allRows.length} with items + valid GL accounts`,
    );

    // Group by PostOrder
    const rowsByPostOrder = new Map<number, any[]>();
    for (const row of allRows) {
      const po = parseInt(row.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      if (!rowsByPostOrder.has(po)) rowsByPostOrder.set(po, []);
      rowsByPostOrder.get(po)!.push(row);
    }

    // Prefer PostOrders that actually contain item rows (invoices) over
    // payment/receipt headers that share the same PQ key (e.g. 172 vs 3100).
    const postOrdersWithItems = new Set<number>(rowsByPostOrder.keys());
    for (const po of [...postOrderToSalesOrderId.keys()]) {
      if (!postOrdersWithItems.has(po)) postOrderToSalesOrderId.delete(po);
    }
    for (const po of [...postOrderToPurchaseOrderId.keys()]) {
      if (!postOrdersWithItems.has(po)) postOrderToPurchaseOrderId.delete(po);
    }
    this.logger.log(
      `JrnlRow grouped: ${rowsByPostOrder.size} unique PostOrders from ${allRows.length} rows; ${postOrderToSalesOrderId.size} sales / ${postOrderToPurchaseOrderId.size} purchase PostOrders with items after pruning`,
    );

    const salesBatch: any[] = [];
    const purchaseBatch: any[] = [];

    for (const [postOrder, rows] of rowsByPostOrder) {
      const salesOrderId = postOrderToSalesOrderId.get(postOrder);
      if (salesOrderId) {
        const expected = this.buildExpectedItems(
          rows,
          salesOrderId,
          recordToProduct,
        );
        if (salesOrderHasItems.has(salesOrderId)) {
          const existing = existingSalesItems.filter(
            (i) => i.order_id === salesOrderId,
          );
          if (!this.itemsEqual(existing, expected)) {
            await this.reviewService.createReview({
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              recordKey: `sales-order-${salesOrderId}`,
              changeType: 'update',
              dbRecordId: salesOrderId,
              oldValues: { kind: 'sales', items: existing },
              newValues: { kind: 'sales', items: expected },
            });
            await this.reviewService.log({
              runId,
              triggeredBy: 'manual',
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              action: SyncLogAction.DIFFERENT,
              recordKey: `sales-order-${salesOrderId}`,
            });
            result.recordsUpdated++;
          } else {
            result.recordsSkipped++;
          }
        } else {
          salesBatch.push(...expected);
          result.recordsProcessed += expected.length;
          salesOrderHasItems.add(salesOrderId);
        }
        continue;
      }

      const purchaseOrderId = postOrderToPurchaseOrderId.get(postOrder);
      if (purchaseOrderId) {
        const expected = this.buildExpectedItems(
          rows,
          purchaseOrderId,
          recordToProduct,
        );
        if (purchaseOrderHasItems.has(purchaseOrderId)) {
          const existing = existingPurchaseItems.filter(
            (i) => i.order_id === purchaseOrderId,
          );
          if (!this.itemsEqual(existing, expected)) {
            await this.reviewService.createReview({
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              recordKey: `purchase-order-${purchaseOrderId}`,
              changeType: 'update',
              dbRecordId: purchaseOrderId,
              oldValues: { kind: 'purchase', items: existing },
              newValues: { kind: 'purchase', items: expected },
            });
            await this.reviewService.log({
              runId,
              triggeredBy: 'manual',
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              action: SyncLogAction.DIFFERENT,
              recordKey: `purchase-order-${purchaseOrderId}`,
            });
            result.recordsUpdated++;
          } else {
            result.recordsSkipped++;
          }
        } else {
          purchaseBatch.push(...expected);
          result.recordsProcessed += expected.length;
          purchaseOrderHasItems.add(purchaseOrderId);
        }
      }
    }

    for (let i = 0; i < salesBatch.length; i += BATCH_SIZE) {
      const chunk = salesBatch.slice(i, i + BATCH_SIZE);
      await this.salesOrderItemRepo
        .createQueryBuilder()
        .insert()
        .into(SalesOrderItem)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    for (let i = 0; i < purchaseBatch.length; i += BATCH_SIZE) {
      const chunk = purchaseBatch.slice(i, i + BATCH_SIZE);
      await this.purchaseOrderItemRepo
        .createQueryBuilder()
        .insert()
        .into(PurchaseOrderItem)
        .values(chunk)
        .orIgnore()
        .execute();
    }

    result.recordsCreated = salesBatch.length + purchaseBatch.length;
    this.logger.log(
      `Line items: ${salesBatch.length} sales + ${purchaseBatch.length} purchase created`,
    );

    const finalSalesWithItems = await this.salesOrderItemRepo
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.order_id)', 'cnt')
      .getRawOne();
    const finalPurchaseWithItems = await this.purchaseOrderItemRepo
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.order_id)', 'cnt')
      .getRawOne();
    this.logger.log(
      `After item sync: ${finalSalesWithItems?.cnt || 0} sales orders with items, ${finalPurchaseWithItems?.cnt || 0} purchase orders with items`,
    );
  }

  async resyncItems(): Promise<{
    salesCreated: number;
    purchaseCreated: number;
    message: string;
  }> {
    const syncId = `resync_${Date.now()}`;
    const syncStatus: SyncStatusResponseDto = {
      id: syncId,
      startedAt: new Date(),
      status: SyncStatus.RUNNING,
      triggeredBy: 'resync-items',
      results: [],
      currentEntity: SyncEntity.INVOICE_LINE_ITEMS,
      percentComplete: 0,
    };
    this.currentSync = syncStatus;

    try {
      const allSalesOrders = await this.salesOrderRepo.find({
        select: ['id', 'invoice_number'],
      });
      const allPurchaseOrders = await this.purchaseOrderRepo.find({
        select: ['id', 'invoice_number'],
      });

      const existingSalesItems = await this.salesOrderItemRepo.find({
        select: ['order_id'],
      });
      const existingPurchaseItems = await this.purchaseOrderItemRepo.find({
        select: ['order_id'],
      });

      const salesWithItems = new Set(existingSalesItems.map((i) => i.order_id));
      const purchaseWithItems = new Set(
        existingPurchaseItems.map((i) => i.order_id),
      );

      const salesWithoutItems = allSalesOrders.filter(
        (o) => !salesWithItems.has(o.id),
      );
      const purchaseWithoutItems = allPurchaseOrders.filter(
        (o) => !purchaseWithItems.has(o.id),
      );

      this.logger.log(
        `Re-sync: ${salesWithoutItems.length} sales orders without items, ${purchaseWithoutItems.length} purchase orders without items`,
      );
      syncStatus.percentComplete = 10;

      const result: SyncResultDto = {
        entity: SyncEntity.INVOICE_LINE_ITEMS,
        status: SyncStatus.RUNNING,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [],
      };

      await this.syncInvoiceLineItems(result, syncId);
      syncStatus.percentComplete = 90;

      const finalSales = await this.salesOrderItemRepo
        .createQueryBuilder('item')
        .select('COUNT(DISTINCT item.order_id)', 'cnt')
        .getRawOne();
      const finalPurchase = await this.purchaseOrderItemRepo
        .createQueryBuilder('item')
        .select('COUNT(DISTINCT item.order_id)', 'cnt')
        .getRawOne();

      const message = `Re-synced items: ${result.recordsCreated} items created. Now ${finalSales?.cnt || 0} sales orders and ${finalPurchase?.cnt || 0} purchase orders have items.`;

      syncStatus.results.push(result);
      syncStatus.completedAt = new Date();
      syncStatus.status =
        result.errors.length > 0 ? SyncStatus.FAILED : SyncStatus.COMPLETED;
      syncStatus.percentComplete = 100;
      syncStatus.currentEntity = '';
      syncStatus.records_synced = result.recordsCreated;
      syncStatus.duration_ms =
        syncStatus.completedAt.getTime() - syncStatus.startedAt.getTime();
      this.syncHistory.unshift(syncStatus);

      return {
        salesCreated: finalSales?.cnt || 0,
        purchaseCreated: finalPurchase?.cnt || 0,
        message,
      };
    } catch (error) {
      syncStatus.completedAt = new Date();
      syncStatus.status = SyncStatus.FAILED;
      syncStatus.percentComplete = 100;
      syncStatus.currentEntity = '';
      syncStatus.duration_ms =
        syncStatus.completedAt.getTime() - syncStatus.startedAt.getTime();
      this.syncHistory.unshift(syncStatus);
      throw error;
    }
  }

  async preview(triggeredBy = 'manual'): Promise<SyncStatusResponseDto> {
    return this.runSync(triggeredBy, 'full');
  }

  async getReview(entity?: SyncEntity): Promise<PeachtreeSyncReview[]> {
    return this.reviewService.getPendingReview(entity);
  }

  async getLog(runId?: string): Promise<PeachtreeSyncLog[]> {
    return this.reviewService.getReviewLog(runId);
  }

  async skipReview(
    ids: number[],
  ): Promise<{ skipped: number; errors: string[] }> {
    const errors: string[] = [];
    let rows: Awaited<ReturnType<typeof this.reviewService.getPendingByIds>> | undefined;
    try {
      rows = await this.reviewService.getPendingByIds(ids || []);
    } catch (error: any) {
      return {
        skipped: 0,
        errors: [`skipReview lookup failed: ${error?.message || String(error)}`],
      };
    }
    const runId = `skip_${Date.now()}`;
    let skipped = 0;
    for (const row of rows) {
      try {
        await this.reviewService.markSkippedRow(row);
        skipped++;
        await this.reviewService.log({
          runId,
          triggeredBy: 'skip',
          entity: row.entity as SyncEntity,
          action: SyncLogAction.SKIPPED_REVIEW,
          recordKey: row.record_key,
        });
      } catch (error: any) {
        errors.push(
          `${row.entity}:${row.record_key} — ${error?.message || String(error)}`,
        );
      }
    }
    return { skipped, errors };
  }

  async applyReview(
    ids: number[],
  ): Promise<{ applied: number; errors: string[] }> {
    let rows: Awaited<ReturnType<typeof this.reviewService.getPendingByIds>> | undefined;
    try {
      rows = await this.reviewService.getPendingByIds(ids || []);
    } catch (error: any) {
      return {
        applied: 0,
        errors: [`applyReview lookup failed: ${error?.message || String(error)}`],
      };
    }
    const runId = `apply_${Date.now()}`;
    let applied = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        if (row.change_type === 'missing') {
          await this.reviewService.markAccepted(row);
          applied++;
          await this.reviewService.log({
            runId,
            triggeredBy: 'apply',
            entity: row.entity as SyncEntity,
            action: SyncLogAction.MISSING,
            recordKey: row.record_key,
            changes: null,
          });
          continue;
        }
        const nv: any = row.new_values || {};
        switch (row.entity) {
          case SyncEntity.CUSTOMERS:
            await this.customerRepo.update(row.db_record_id!, {
              phone: nv.phone,
              email: nv.email,
              address: nv.address,
              balance: nv.balance,
            });
            break;
          case SyncEntity.SUPPLIERS:
            await this.supplierRepo.update(row.db_record_id!, {
              phone: nv.phone,
              email: nv.email,
              address: nv.address,
              balance: nv.balance,
            });
            break;
          case SyncEntity.PRODUCTS:
            await this.productRepo.update(row.db_record_id!, {
              name: nv.name,
              sku: nv.sku,
              cost_price: nv.cost_price,
              selling_price: nv.selling_price,
              unit: nv.unit,
              description: nv.description,
              type: nv.type,
            });
            break;
          case SyncEntity.SALES_INVOICES:
            await this.salesOrderRepo.update(row.db_record_id!, {
              total_amount: nv.total_amount,
              status: nv.status,
              order_date: nv.order_date || null,
              notes: nv.notes,
            });
            if (nv.status === OrderStatus.COMPLETED) {
              await this.deliverSingleOrder(row.db_record_id!, runId);
            }
            break;
          case SyncEntity.PURCHASE_INVOICES:
            await this.purchaseOrderRepo.update(row.db_record_id!, {
              total_amount: nv.total_amount,
              status: nv.status,
              order_date: nv.order_date || null,
              notes: nv.notes,
            });
            break;
          case SyncEntity.INVOICE_LINE_ITEMS:
            ;{
              const orderId = row.db_record_id;
              if (orderId && Array.isArray(nv.items)) {
                const items = (nv.items as Record<string, unknown>[]).map(
                  (it) => ({ order_id: orderId, ...it }),
                );
                if (nv.kind === 'purchase') {
                  await this.purchaseOrderItemRepo.delete({
                    order_id: orderId,
                  });
                  if (items.length > 0) {
                    await this.purchaseOrderItemRepo.insert(items);
                  }
                } else {
                  await this.salesOrderItemRepo.delete({
                    order_id: orderId,
                  });
                  if (items.length > 0) {
                    await this.salesOrderItemRepo.insert(items);
                  }
                }
              }
            }
            break;
        }
        await this.reviewService.markAccepted(row);
        const changes = this.reviewService.computeDiff(
          row.old_values || {},
          nv,
        );
        await this.reviewService.log({
          runId,
          triggeredBy: 'apply',
          entity: row.entity as SyncEntity,
          action: SyncLogAction.UPDATED,
          recordKey: row.record_key,
          changes,
        });
        applied++;
      } catch (error: any) {
        errors.push(
          `${row.entity}:${row.record_key} — ${error?.message || String(error)}`,
        );
      }
    }
    return { applied, errors };
  }

  getSyncHistory(): Promise<SyncStatusResponseDto[]> {
    return Promise.resolve(this.syncHistory);
  }

  getCurrentSync(): SyncStatusResponseDto | null {
    return this.currentSync;
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    return this.connectionService.testConnection();
  }

  async getAvailableTables(): Promise<string[]> {
    return this.connectionService.getTableNames();
  }

  getDataPath(): string {
    return this.connectionService.getDataPath();
  }

  setDataPath(dataPath: string): void {
    this.connectionService.setDataPath(dataPath);
  }

  async debugInvoiceLink(): Promise<any> {
    const result: any = {};

    // 1. JrnlHdr all rows with fields for PostOrder matching
    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr all: ${e.message}`);
        return [];
      });
    result.jrnlHdr_count = allHeaders.length;

    // 2. Filter sales headers (Module='R')
    const salesHeaders = allHeaders.filter(
      (h: any) => String(h.Module).trim() === 'R',
    );
    result.salesHeaders_count = salesHeaders.length;

    // 3. Build PQ key maps from headers
    const hdrPqKeyToPostOrder = new Map<string, number>();
    for (const h of salesHeaders) {
      const pqKey = `${h.JrnlKey_TrxNumber}_${h.JrnlKey_Per}_${h.JrnlKey_Journal}`;
      if (!hdrPqKeyToPostOrder.has(pqKey))
        hdrPqKeyToPostOrder.set(pqKey, parseInt(h.PostOrder, 10));
    }
    result.hdrPqKey_count = hdrPqKeyToPostOrder.size;

    // 4. Extract PQ keys from DB order notes
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const salesOrders = await this.salesOrderRepo.find({
      select: ['id', 'notes'],
    });
    const dbPqKeys = new Map<string, number>();
    for (const o of salesOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) dbPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    result.dbOrderCount = salesOrders.length;
    result.dbPqKey_count = dbPqKeys.size;

    // 5. Find matches
    let matches = 0;
    const sampleMatches: any[] = [];
    for (const [pqKey, orderId] of dbPqKeys) {
      if (hdrPqKeyToPostOrder.has(pqKey)) {
        matches++;
        if (sampleMatches.length < 3) {
          sampleMatches.push({
            pqKey,
            orderId,
            postOrder: hdrPqKeyToPostOrder.get(pqKey),
          });
        }
      }
    }
    result.matches = matches;
    result.sampleMatches = sampleMatches;

    // 6. Sample unmatched DB keys
    const unmatchedKeys = [...dbPqKeys.keys()].filter(
      (k) => !hdrPqKeyToPostOrder.has(k),
    );
    result.unmatched_count = unmatchedKeys.length;
    result.unmatched_sample = unmatchedKeys.slice(0, 5);

    // 7. Sample header keys
    result.hdr_sampleKeys = [...hdrPqKeyToPostOrder.keys()].slice(0, 5);

    // 8. Check LineItem table
    const lineItems = await this.connectionService
      .query('LineItem')
      .catch((e) => {
        this.logger.warn(`LineItem: ${e.message}`);
        return [];
      });
    result.lineItemCount = lineItems.length;
    result.lineItemSample =
      lineItems.length > 0 ? Object.keys(lineItems[0]) : [];

    // 9. Check JrnlRow count and item rows
    const allJrnlRows = await this.connectionService
      .query(
        'JrnlRow',
        0,
        'PostOrder, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber',
      )
      .catch(() => []);
    result.jrnlRowCount = allJrnlRows.length;
    const itemRows = allJrnlRows.filter(
      (r: any) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    result.jrnlRowWithItems = itemRows.length;

    // 10. Check matched PostOrders in JrnlRow
    if (sampleMatches.length > 0) {
      const allPOs = sampleMatches.map((m: any) => m.postOrder);
      const matchedJORows = allJrnlRows.filter((r: any) =>
        allPOs.includes(parseInt(r.PostOrder, 10)),
      );
      result.matchedPO_jrnlRows_total = matchedJORows.length;
      result.matchedPO_jrnlRows_withItems = matchedJORows.filter(
        (r: any) => parseInt(r.ItemRecordNumber, 10) > 0,
      ).length;
      result.matchedPO_jrnlRows_sample = matchedJORows
        .filter((r: any) => parseInt(r.ItemRecordNumber, 10) > 0)
        .slice(0, 3);

      // Also check: how many JrnlRow PostOrders exist in the header PostOrder set?
      const headerPostOrders = new Set(
        salesHeaders.map((h: any) => parseInt(h.PostOrder, 10)),
      );
      const jrnlRowsInHeaderPO = allJrnlRows.filter((r: any) =>
        headerPostOrders.has(parseInt(r.PostOrder, 10)),
      );
      result.jrnlRows_matchingHeaderPO = jrnlRowsInHeaderPO.length;
      result.jrnlRows_matchingHeaderPO_withItems = jrnlRowsInHeaderPO.filter(
        (r: any) => parseInt(r.ItemRecordNumber, 10) > 0,
      ).length;

      // Check unique PostOrders in JrnlRow that also exist in headers
      const jrnlRowPOs = new Set(
        allJrnlRows
          .filter((r: any) => parseInt(r.ItemRecordNumber, 10) > 0)
          .map((r: any) => parseInt(r.PostOrder, 10)),
      );
      const matchedPOSet = new Set(sampleMatches.map((m: any) => m.postOrder));
      const poOverlap = [...jrnlRowPOs].filter((po) => matchedPOSet.has(po));
      result.poOverlapCount = poOverlap.length;
      result.poOverlapSample = poOverlap.slice(0, 5);
    }

    return result;
  }

  async debugDryRunItems(): Promise<any> {
    const result: any = {};

    const jrnlRowFields =
      'PostOrder, CustomerRecordNumber, VendorRecordNumber, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber, RowDescription';

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    result.productCount = products.length;

    const normalizeArabic = (text: string): string => {
      return text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };
    const STRIP_PREFIXES = ['علب', 'علبه', 'كرتون', 'كرتونة'];
    const stripPrefix = (text: string): string => {
      let t = normalizeArabic(text);
      for (const prefix of STRIP_PREFIXES) {
        if (t.startsWith(prefix + ' ')) {
          t = t.substring(prefix.length).trim();
          break;
        }
      }
      return t;
    };

    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    const productByFuzzy = new Map<string, number>();
    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
      const stripped = stripPrefix(p.name);
      if (stripped && !productByFuzzy.has(stripped))
        productByFuzzy.set(stripped, p.id);
    }

    const lineItems = await this.connectionService
      .query('LineItem')
      .catch(() => []);
    result.lineItemCount = lineItems.length;

    const recordToProduct = new Map<number, number>();
    let matchedCount = 0;
    for (const li of lineItems) {
      const recNo = parseInt(li.ItemRecordNumber, 10);
      if (isNaN(recNo) || recNo <= 0) continue;
      const desc = li.ItemDescription || '';
      const itemId = li.ItemID || '';
      let pid = li.UPC_SKU
        ? productBySku.get(normalizeArabic(li.UPC_SKU)) || 0
        : 0;
      if (!pid && desc) pid = productByName.get(normalizeArabic(desc)) || 0;
      if (!pid && desc) {
        const stripped = stripPrefix(desc);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && desc) {
        const normDesc = normalizeArabic(desc);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normDesc.includes(normName) || normName.includes(normDesc))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (!pid && itemId) {
        pid = productByName.get(normalizeArabic(itemId)) || 0;
      }
      if (!pid && itemId) {
        const stripped = stripPrefix(itemId);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && itemId) {
        const normItemId = normalizeArabic(itemId);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normItemId.includes(normName) || normName.includes(normItemId))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (pid) {
        recordToProduct.set(recNo, pid);
        matchedCount++;
      }
    }
    result.productMappingCount = matchedCount;

    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const salesOrders = await this.salesOrderRepo.find({
      select: ['id', 'notes'],
    });
    const purchaseOrders = await this.purchaseOrderRepo.find({
      select: ['id', 'notes'],
    });
    const salesOrderPqKeys = new Map<string, number>();
    const purchaseOrderPqKeys = new Map<string, number>();
    for (const o of salesOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) salesOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    for (const o of purchaseOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) purchaseOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    result.salesPqKeys = salesOrderPqKeys.size;
    result.purchasePqKeys = purchaseOrderPqKeys.size;

    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch(() => []);
    result.totalHeaders = allHeaders.length;

    const postOrderToSalesOrderId = new Map<number, number>();
    const postOrderToPurchaseOrderId = new Map<number, number>();
    for (const hdr of allHeaders) {
      const postOrder = parseInt(hdr.PostOrder, 10);
      if (isNaN(postOrder) || postOrder <= 0) continue;
      const pqKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const module = String(hdr.Module || '').trim();
      if (module === 'R') {
        const oid = salesOrderPqKeys.get(pqKey);
        if (oid) postOrderToSalesOrderId.set(postOrder, oid);
      } else if (module === 'P') {
        const oid = purchaseOrderPqKeys.get(pqKey);
        if (oid) postOrderToPurchaseOrderId.set(postOrder, oid);
      }
    }
    result.salesPostOrderMapSize = postOrderToSalesOrderId.size;
    result.purchasePostOrderMapSize = postOrderToPurchaseOrderId.size;

    const allRawRows = await this.connectionService
      .query('JrnlRow', 0, jrnlRowFields)
      .catch(() => []);
    result.totalJrnlRows = allRawRows.length;

    const glAccountSet = new Set([0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55]);
    const allRows = allRawRows.filter((r: any) => {
      const itemRec = parseInt(r.ItemRecordNumber, 10);
      const glAcnt = parseInt(r.GLAcntNumber, 10);
      return itemRec > 0 && glAccountSet.has(glAcnt);
    });
    result.filteredJrnlRows = allRows.length;

    const rowsByPostOrder = new Map<number, any[]>();
    for (const row of allRows) {
      const po = parseInt(row.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      if (!rowsByPostOrder.has(po)) rowsByPostOrder.set(po, []);
      rowsByPostOrder.get(po)!.push(row);
    }
    result.uniquePostOrders = rowsByPostOrder.size;

    const postOrdersWithItems = new Set<number>(rowsByPostOrder.keys());
    for (const po of [...postOrderToSalesOrderId.keys()]) {
      if (!postOrdersWithItems.has(po)) postOrderToSalesOrderId.delete(po);
    }
    for (const po of [...postOrderToPurchaseOrderId.keys()]) {
      if (!postOrdersWithItems.has(po)) postOrderToPurchaseOrderId.delete(po);
    }

    let salesMatchedPOs = 0;
    let purchaseMatchedPOs = 0;
    let unmatchedPOs = 0;
    let salesCandidateItems = 0;
    let purchaseCandidateItems = 0;
    let salesProductHits = 0;
    let salesProductMisses = 0;
    const sampleSalesItems: any[] = [];
    const missedProductRecNos = new Set<number>();

    for (const [postOrder, rows] of rowsByPostOrder) {
      const salesOrderId = postOrderToSalesOrderId.get(postOrder);
      if (salesOrderId) {
        salesMatchedPOs++;
        for (const row of rows) {
          const recNo = parseInt(row.ItemRecordNumber, 10);
          const productId = recordToProduct.get(recNo) || 0;
          if (!productId) {
            salesProductMisses++;
            if (missedProductRecNos.size < 10) missedProductRecNos.add(recNo);
            continue;
          }
          salesProductHits++;
          salesCandidateItems++;
          if (sampleSalesItems.length < 3) {
            sampleSalesItems.push({
              postOrder,
              salesOrderId,
              recNo,
              productId,
              qty: row.Quantity,
              price: row.UnitCost,
              amount: row.Amount,
            });
          }
        }
        continue;
      }
      const purchaseOrderId = postOrderToPurchaseOrderId.get(postOrder);
      if (purchaseOrderId) {
        purchaseMatchedPOs++;
        for (const row of rows) {
          const recNo = parseInt(row.ItemRecordNumber, 10);
          const productId = recordToProduct.get(recNo) || 0;
          if (!productId) continue;
          purchaseCandidateItems++;
        }
      } else {
        unmatchedPOs++;
      }
    }

    result.salesMatchedPOs = salesMatchedPOs;
    result.purchaseMatchedPOs = purchaseMatchedPOs;
    result.unmatchedPOs = unmatchedPOs;
    result.salesProductHits = salesProductHits;
    result.salesProductMisses = salesProductMisses;
    result.salesCandidateItems = salesCandidateItems;
    result.purchaseCandidateItems = purchaseCandidateItems;
    result.sampleSalesItems = sampleSalesItems;
    result.missedProductRecNos = [...missedProductRecNos];
    result.productMappingSample = [...recordToProduct.entries()].slice(0, 10);

    return result;
  }

  async debugLineItemMapping(): Promise<any> {
    const result: any = {};
    const normalizeArabic = (text: string): string => {
      return text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const lineItems = await this.connectionService
      .query(
        'LineItem',
        0,
        'ItemRecordNumber, ItemID, ItemDescription, UPC_SKU, SalesDescription, PartNumber, MasterItemID',
      )
      .catch(() => []);
    result.totalLineItems = lineItems.length;

    const targetRecNos = [
      247, 77, 252, 283, 282, 231, 128, 255, 253, 280, 1, 3, 5, 10,
    ];
    const matched = lineItems.filter((li: any) =>
      targetRecNos.includes(parseInt(li.ItemRecordNumber, 10)),
    );
    result.matchedLineItems = matched.map((li: any) => ({
      recNo: li.ItemRecordNumber,
      itemID: li.ItemID,
      description: li.ItemDescription,
      sku: li.UPC_SKU,
      salesDesc: li.SalesDescription,
      partNumber: li.PartNumber,
      masterID: li.MasterItemID,
    }));

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    result.sampleProducts = products
      .slice(0, 15)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku }));

    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
    }

    const matchResults = matched.map((li: any) => {
      const desc = li.ItemDescription || '';
      const sku = li.UPC_SKU || '';
      const byName = productByName.get(normalizeArabic(desc));
      const bySku = productBySku.get(normalizeArabic(sku));
      return {
        recNo: li.ItemRecordNumber,
        desc: desc,
        sku: sku,
        matchedByName: byName || null,
        matchedBySku: bySku || null,
        normDesc: normalizeArabic(desc),
      };
    });
    result.matchResults = matchResults;

    return result;
  }

  async debugGlAccounts(): Promise<any> {
    const result: any = {};

    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, Module, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal',
      )
      .catch(() => []);

    const salesPostOrders = new Set<number>();
    const purchasePostOrders = new Set<number>();
    for (const h of allHeaders) {
      const po = parseInt(h.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      const mod = String(h.Module || '').trim();
      if (mod === 'R') salesPostOrders.add(po);
      else if (mod === 'P') purchasePostOrders.add(po);
    }

    const allRows = await this.connectionService
      .query(
        'JrnlRow',
        0,
        'PostOrder, ItemRecordNumber, GLAcntNumber, Quantity, UnitCost, Amount',
      )
      .catch(() => []);

    const salesRows = allRows.filter((r: any) =>
      salesPostOrders.has(parseInt(r.PostOrder, 10)),
    );
    const purchaseRows = allRows.filter((r: any) =>
      purchasePostOrders.has(parseInt(r.PostOrder, 10)),
    );

    result.totalJrnlRows = allRows.length;
    result.salesJrnlRows = salesRows.length;
    result.purchaseJrnlRows = purchaseRows.length;

    const glSet = [0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55];

    const salesWithItems = salesRows.filter(
      (r: any) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    const salesWithItemsFiltered = salesWithItems.filter((r: any) =>
      glSet.includes(parseInt(r.GLAcntNumber, 10)),
    );
    result.salesWithItems = salesWithItems.length;
    result.salesWithItemsAfterGLFilter = salesWithItemsFiltered.length;

    const purchaseWithItems = purchaseRows.filter(
      (r: any) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    const purchaseWithItemsFiltered = purchaseWithItems.filter((r: any) =>
      glSet.includes(parseInt(r.GLAcntNumber, 10)),
    );
    result.purchaseWithItems = purchaseWithItems.length;
    result.purchaseWithItemsAfterGLFilter = purchaseWithItemsFiltered.length;

    const salesGlDist: Record<string, number> = {};
    for (const r of salesWithItems) {
      const gl = String(r.GLAcntNumber);
      salesGlDist[gl] = (salesGlDist[gl] || 0) + 1;
    }
    const sortedSalesGl = Object.entries(salesGlDist)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 20);
    result.salesGlDistribution = sortedSalesGl;

    const purchaseGlDist: Record<string, number> = {};
    for (const r of purchaseWithItems) {
      const gl = String(r.GLAcntNumber);
      purchaseGlDist[gl] = (purchaseGlDist[gl] || 0) + 1;
    }
    const sortedPurchaseGl = Object.entries(purchaseGlDist)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 20);
    result.purchaseGlDistribution = sortedPurchaseGl;

    result.allowedGLSet = glSet;

    return result;
  }
}
