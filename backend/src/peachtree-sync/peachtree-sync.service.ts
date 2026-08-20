import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { PurchaseOrder, PurchaseOrderStatus } from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { PeachtreeReviewService } from './peachtree-review.service';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
import { PeachtreeSyncDebugService } from './peachtree-sync-debug.service';
import { PeachtreeSyncMasterService } from './peachtree-sync-master.service';
import { PeachtreeSyncInvoiceService } from './peachtree-sync-invoice.service';

const SKIP_IF_SYNCED_MS = 60 * 60 * 1000; // 1 hour

interface SyncNewValues extends Record<string, unknown> {
  phone?: string;
  email?: string;
  address?: string;
  balance?: number;
  name?: string;
  sku?: string;
  cost_price?: number;
  selling_price?: number;
  unit?: string;
  description?: string;
  type?: string;
  total_amount?: number;
  status?: string;
  order_date?: Date;
  notes?: string;
  items?: Array<Record<string, unknown>>;
  kind?: string;
}

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
    private dataSource: DataSource,
    private debugService: PeachtreeSyncDebugService,
    private masterService: PeachtreeSyncMasterService,
    private invoiceService: PeachtreeSyncInvoiceService,
  ) {}

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

  private get syncContext() {
    return {
      shouldSkip: (entity: string, peachtreeCount: number) => {
        return this.shouldSkip(entity, peachtreeCount);
      },
      markSynced: (entity: string, count: number) => {
        return this.markSynced(entity, count);
      },
    };
  }

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

    const deliveryResult =
      await this.masterService.deliverSyncSalesOrders(syncId);
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
      const deliveryResult =
        await this.masterService.deliverSyncSalesOrders(syncId);
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
          await this.masterService.syncCustomers(
            result,
            runId,
            this.syncContext,
          );
          break;
        case SyncEntity.SUPPLIERS:
          await this.masterService.syncSuppliers(
            result,
            runId,
            this.syncContext,
          );
          break;
        case SyncEntity.PRODUCTS:
          await this.masterService.syncProducts(
            result,
            runId,
            this.syncContext,
          );
          break;
        case SyncEntity.SALES_INVOICES:
          await this.invoiceService.syncSalesInvoices(result, runId);
          break;
        case SyncEntity.PURCHASE_INVOICES:
          await this.invoiceService.syncPurchaseInvoices(result, runId);
          break;
        case SyncEntity.INVOICE_LINE_ITEMS:
          await this.invoiceService.syncInvoiceLineItems(result, runId);
          break;
      }
      result.status = SyncStatus.COMPLETED;
    } catch (error) {
      result.status = SyncStatus.FAILED;
      result.errors.push(error.message || String(error));
    }

    return result;
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
      const result: SyncResultDto = {
        entity: SyncEntity.INVOICE_LINE_ITEMS,
        status: SyncStatus.RUNNING,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [],
      };

      await this.invoiceService.syncInvoiceLineItems(result, syncId);
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
    let rows:
      | Awaited<ReturnType<typeof this.reviewService.getPendingByIds>>
      | undefined;
    try {
      rows = await this.reviewService.getPendingByIds(ids || []);
    } catch (error: any) {
      return {
        skipped: 0,
        errors: [
          `skipReview lookup failed: ${error?.message || String(error)}`,
        ],
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
    let rows:
      | Awaited<ReturnType<typeof this.reviewService.getPendingByIds>>
      | undefined;
    try {
      rows = await this.reviewService.getPendingByIds(ids || []);
    } catch (error: any) {
      return {
        applied: 0,
        errors: [
          `applyReview lookup failed: ${error?.message || String(error)}`,
        ],
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
        const nv: SyncNewValues = (row.new_values as SyncNewValues) || {};
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
              status: nv.status as OrderStatus,
              order_date: nv.order_date || undefined,
              notes: nv.notes,
            });
            if (nv.status === OrderStatus.COMPLETED) {
              await this.masterService.deliverSingleOrder(
                row.db_record_id!,
                runId,
              );
            }
            break;
          case SyncEntity.PURCHASE_INVOICES:
            await this.purchaseOrderRepo.update(row.db_record_id!, {
              total_amount: nv.total_amount,
              status: nv.status as PurchaseOrderStatus,
              order_date: nv.order_date || undefined,
              notes: nv.notes,
            });
            break;
          case SyncEntity.INVOICE_LINE_ITEMS:
            {
              const orderId = row.db_record_id;
              const DEC_MAX = 99999999.99;
              const clamp = (v: number) => Math.min(Math.max(v, 0), DEC_MAX);
              if (orderId && Array.isArray(nv.items)) {
                const raw = nv.items as Record<string, unknown>[];
                const merged = new Map<number, Record<string, unknown>>();
                for (const it of raw) {
                  const pid = Number(it.product_id);
                  const qty = Number(it.quantity) || 0;
                  const price = Number(it.price) || 0;
                  if (merged.has(pid)) {
                    const existing = merged.get(pid)!;
                    existing.quantity = clamp(
                      (Number(existing.quantity) || 0) + qty,
                    );
                    existing.total = clamp(
                      (Number(existing.total) || 0) + qty * price,
                    );
                  } else {
                    merged.set(pid, {
                      ...it,
                      quantity: clamp(qty),
                      price: clamp(price),
                      total: clamp(qty * price),
                    });
                  }
                }
                const items = [...merged.values()].map((it) => ({
                  order_id: orderId,
                  product_id: Number(it.product_id),
                  quantity: Number(Number(it.quantity).toFixed(2)),
                  price: Number(Number(it.price).toFixed(2)),
                  total: Number(Number(it.total).toFixed(2)),
                }));
                if (nv.kind === 'purchase') {
                  await this.dataSource.transaction(async (manager) => {
                    await manager.delete(PurchaseOrderItem, {
                      order_id: orderId,
                    });
                    if (items.length > 0) {
                      await manager.insert(PurchaseOrderItem, items);
                    }
                  });
                } else {
                  await this.dataSource.transaction(async (manager) => {
                    await manager.delete(SalesOrderItem, {
                      order_id: orderId,
                    });
                    if (items.length > 0) {
                      await manager.insert(SalesOrderItem, items);
                    }
                  });
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

  async debugInvoiceLink(): Promise<Record<string, unknown>> {
    return this.debugService.debugInvoiceLink();
  }

  async debugDryRunItems(): Promise<Record<string, unknown>> {
    return this.debugService.debugDryRunItems();
  }

  async debugLineItemMapping(): Promise<Record<string, unknown>> {
    return this.debugService.debugLineItemMapping();
  }

  async debugGlAccounts(): Promise<Record<string, unknown>> {
    return this.debugService.debugGlAccounts();
  }
}
