import {
  Injectable,
  Logger,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import {
  SyncEntity,
  SyncResultDto,
  SyncStatus,
  SyncStatusResponseDto,
  ReviewJobAction,
  ReviewJobStatusDto,
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
import {
  PeachtreeReviewService,
  LogCreateInput,
} from './peachtree-review.service';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
import { PeachtreeReviewJob } from './entities/peachtree-review-job.entity';
import { PeachtreeSyncDebugService } from './peachtree-sync-debug.service';
import { PeachtreeSyncMasterService } from './peachtree-sync-master.service';
import { PeachtreeSyncInvoiceService } from './peachtree-sync-invoice.service';

const SKIP_IF_SYNCED_MS = 60 * 60 * 1000; // 1 hour

/** Rows fetched per page by a bulk review job. */
const REVIEW_JOB_PAGE_SIZE = 200;

/** Called once per review row, after it has been decided. */
type ReviewRowObserver = (row: PeachtreeSyncReview, ok: boolean) => void;

/**
 * Map a live job snapshot to its persisted row shape. Kept as pure exported
 * functions so the mapping is unit-testable without a database.
 */
export function toReviewJobRow(
  job: ReviewJobStatusDto,
): Omit<PeachtreeReviewJob, 'id' | 'created_at'> {
  return {
    job_id: job.id,
    action: job.action,
    status: job.status,
    started_at: new Date(job.startedAt),
    completed_at: job.completedAt ? new Date(job.completedAt) : null,
    total: job.total,
    done: job.done,
    applied: job.applied,
    skipped: job.skipped,
    failed: job.failed,
    percent_complete: job.percentComplete,
    current_entity: job.currentEntity ?? null,
    current_record_key: job.currentRecordKey ?? null,
    errors: [...job.errors],
  };
}

export function fromReviewJobRow(row: PeachtreeReviewJob): ReviewJobStatusDto {
  return {
    id: row.job_id,
    action: row.action as ReviewJobAction,
    status: row.status as SyncStatus,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    total: row.total,
    done: row.done,
    applied: row.applied,
    skipped: row.skipped,
    failed: row.failed,
    percentComplete: row.percent_complete,
    currentEntity: row.current_entity ?? undefined,
    currentRecordKey: row.current_record_key ?? undefined,
    errors: [...(row.errors ?? [])],
  };
}

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
export class PeachtreeSyncService implements OnModuleInit {
  private readonly logger = new Logger(PeachtreeSyncService.name);

  /**
   * Record a per-entity result, merging into any existing entry for the same
   * entity. deliverSyncSalesOrders reports SALES_INVOICES too, so a full sync
   * would otherwise emit two results for it and the UI would render two
   * half-counted cards under one label.
   */
  private recordResult(results: SyncResultDto[], result: SyncResultDto): void {
    const existing = results.find((r) => r.entity === result.entity);
    if (!existing) {
      results.push(result);
      return;
    }
    existing.recordsProcessed += result.recordsProcessed;
    existing.recordsCreated += result.recordsCreated;
    existing.recordsUpdated += result.recordsUpdated;
    existing.recordsSkipped += result.recordsSkipped;
    existing.errors.push(...result.errors);
    if (result.status === SyncStatus.FAILED) {
      existing.status = SyncStatus.FAILED;
    }
  }
  private syncHistory: SyncStatusResponseDto[] = [];
  private lastSyncPerEntity = new Map<string, number>();
  private lastSyncCounts = new Map<string, number>();
  private currentSync: SyncStatusResponseDto | null = null;
  // Live counters stay in memory while a job runs; every page boundary and
  // completion is also snapshotted to peachtree_review_job so a restart keeps
  // the last run visible instead of showing nothing.
  private reviewJob: ReviewJobStatusDto | null = null;

  constructor(
    private connectionService: PeachtreeConnectionService,
    private mappingService: PeachtreeMappingService,
    @InjectRepository(PeachtreeReviewJob)
    private reviewJobRepo: Repository<PeachtreeReviewJob>,
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
        this.recordResult(syncStatus.results, result);
      } catch (error) {
        this.recordResult(syncStatus.results, {
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
    this.recordResult(syncStatus.results, deliveryResult);

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
        this.recordResult(syncStatus.results, result);
      } catch (error) {
        this.recordResult(syncStatus.results, {
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
      this.recordResult(syncStatus.results, deliveryResult);
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

      this.recordResult(syncStatus.results, result);
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

  /**
   * Flush collected log entries in one bulk insert. A flush failure is
   * reported but never un-decides rows: the accept/skip already committed.
   */
  private async flushReviewLogs(
    logs: LogCreateInput[],
    errors: string[],
  ): Promise<void> {
    if (logs.length === 0) return;
    try {
      await this.reviewService.logMany(logs);
    } catch (error: any) {
      errors.push(
        `review log flush failed: ${error?.message || String(error)}`,
      );
    }
  }

  async skipReview(
    ids: number[],
    onRow?: ReviewRowObserver,
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
    const pendingLogs: LogCreateInput[] = [];
    for (const row of rows) {
      try {
        await this.reviewService.markSkippedRow(row);
        skipped++;
        onRow?.(row, true);
        pendingLogs.push({
          runId,
          triggeredBy: 'skip',
          entity: row.entity as SyncEntity,
          action: SyncLogAction.SKIPPED_REVIEW,
          recordKey: row.record_key,
        });
      } catch (error: any) {
        onRow?.(row, false);
        errors.push(
          `${row.entity}:${row.record_key} — ${error?.message || String(error)}`,
        );
      }
    }
    await this.flushReviewLogs(pendingLogs, errors);
    return { skipped, errors };
  }

  async applyReview(
    ids: number[],
    onRow?: ReviewRowObserver,
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
    const pendingLogs: LogCreateInput[] = [];

    for (const row of rows) {
      try {
        if (row.change_type === 'missing') {
          await this.reviewService.markAccepted(row);
          applied++;
          onRow?.(row, true);
          pendingLogs.push({
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
        pendingLogs.push({
          runId,
          triggeredBy: 'apply',
          entity: row.entity as SyncEntity,
          action: SyncLogAction.UPDATED,
          recordKey: row.record_key,
          changes,
        });
        applied++;
        onRow?.(row, true);
      } catch (error: any) {
        onRow?.(row, false);
        errors.push(
          `${row.entity}:${row.record_key} — ${error?.message || String(error)}`,
        );
      }
    }
    await this.flushReviewLogs(pendingLogs, errors);
    return { applied, errors };
  }

  getSyncHistory(): Promise<SyncStatusResponseDto[]> {
    return Promise.resolve(this.syncHistory);
  }

  getCurrentSync(): SyncStatusResponseDto | null {
    return this.currentSync;
  }

  /**
   * A job left RUNNING in the table died with its process: the loop that
   * advanced it no longer exists, and silently resuming bulk writes after a
   * deploy would surprise. Mark it failed so the UI tells the user to retry.
   */
  async onModuleInit(): Promise<void> {
    try {
      const stale = await this.reviewJobRepo.find({
        where: { status: SyncStatus.RUNNING },
      });
      for (const row of stale) {
        row.status = SyncStatus.FAILED;
        row.completed_at = new Date();
        row.errors = [
          ...(row.errors ?? []),
          'توقفت العملية بسبب إعادة تشغيل الخادم قبل اكتمالها',
        ];
        await this.reviewJobRepo.save(row);
      }
      if (stale.length > 0) {
        this.logger.warn(
          `Marked ${stale.length} interrupted review job(s) as failed`,
        );
      }
    } catch (error) {
      // Table missing (migration not run yet) or DB down: the job feature
      // keeps working in memory; only the restart-surviving snapshot is lost.
      this.logger.warn(
        `Review job recovery skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Persist a job snapshot. Writes happen on start, on every page boundary
   * and on completion — never per row. Failures are logged, never thrown, so
   * persistence can never break a running job.
   */
  async persistReviewJob(job: ReviewJobStatusDto): Promise<void> {
    try {
      await this.reviewJobRepo.upsert(toReviewJobRow(job), ['job_id']);
    } catch (error) {
      this.logger.warn(
        `Review job snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * The live in-memory job if one exists, otherwise the latest persisted run
   * so a restarted backend still shows what happened instead of nothing.
   */
  async getReviewJob(): Promise<ReviewJobStatusDto | null> {
    if (this.reviewJob) return this.reviewJob;
    try {
      const latest = await this.reviewJobRepo.find({
        order: { id: 'DESC' },
        take: 1,
      });
      return latest.length > 0 ? fromReviewJobRow(latest[0]) : null;
    } catch {
      return null;
    }
  }

  getPendingSummary(entities?: SyncEntity[]) {
    return this.reviewService.getPendingSummary(entities);
  }

  /**
   * Starts a bulk accept/ignore run in the background and returns immediately.
   * The caller polls getReviewJob() for progress, so closing the browser tab
   * does not cancel the work.
   */
  async startReviewJob(
    action: ReviewJobAction,
    entities?: SyncEntity[],
  ): Promise<ReviewJobStatusDto> {
    if (this.reviewJob && this.reviewJob.status === SyncStatus.RUNNING) {
      throw new ConflictException('توجد عملية قبول/تجاهل قيد التنفيذ بالفعل');
    }

    const { total } = await this.reviewService.getPendingSummary(entities);
    const job: ReviewJobStatusDto = {
      id: `revjob_${Date.now()}`,
      action,
      status: SyncStatus.RUNNING,
      startedAt: new Date(),
      total,
      done: 0,
      applied: 0,
      skipped: 0,
      failed: 0,
      percentComplete: 0,
      currentEntity: undefined,
      currentRecordKey: undefined,
      errors: [],
    };
    this.reviewJob = job;
    await this.persistReviewJob(job);

    this.runReviewJob(job, entities).catch((err) => {
      this.logger.error(
        `Background review job ${job.id} crashed: ${err?.stack || err}`,
      );
      job.status = SyncStatus.FAILED;
      job.completedAt = new Date();
      job.percentComplete = 100;
      void this.persistReviewJob(job);
    });

    return job;
  }

  private async runReviewJob(
    job: ReviewJobStatusDto,
    entities?: SyncEntity[],
  ): Promise<void> {
    const isApply = job.action === ReviewJobAction.APPLY;
    const skip = 0;

    // Page by id. Rows already decided drop out of the PENDING filter, so the
    // next page is read from an ever-shrinking set; `skip` stays at 0 and the
    // job never steps over a row it has not processed yet.
    while (job.status === SyncStatus.RUNNING) {
      const page = await this.reviewService.getPendingPage(
        entities,
        skip,
        REVIEW_JOB_PAGE_SIZE,
      );
      if (page.length === 0) break;

      const doneBefore = job.done;
      const ids = page.map((row) => row.id);
      const result = isApply
        ? await this.applyReview(ids, (row, ok) => {
            this.trackReviewJobRow(job, row, ok, isApply);
          })
        : await this.skipReview(ids, (row, ok) => {
            this.trackReviewJobRow(job, row, ok, isApply);
          });

      // Counters are advanced per row by the observer; only the error list
      // has to be folded in here, otherwise applied/skipped double-count.
      job.errors.push(...result.errors);

      // A row that fails stays PENDING, so a page where nothing succeeded
      // would hand back the identical rows forever. Stop instead of spinning.
      if (job.done === doneBefore) {
        job.errors.push(
          `توقفت العملية: لم يتم إنجاز أي سجل في آخر ${page.length} محاولة`,
        );
        break;
      }
      await this.persistReviewJob(job);
    }

    job.status =
      job.errors.length > 0 ? SyncStatus.FAILED : SyncStatus.COMPLETED;
    job.completedAt = new Date();
    job.percentComplete = 100;
    job.currentEntity = undefined;
    job.currentRecordKey = undefined;
    await this.persistReviewJob(job);
  }

  private trackReviewJobRow(
    job: ReviewJobStatusDto,
    row: PeachtreeSyncReview,
    ok: boolean,
    isApply: boolean,
  ): void {
    if (ok) {
      if (isApply) job.applied += 1;
      else job.skipped += 1;
    } else {
      job.failed += 1;
    }
    job.done += 1;
    job.currentEntity = row.entity;
    job.currentRecordKey = row.record_key;
    job.percentComplete =
      job.total > 0 ? Math.round((job.done / job.total) * 100) : 100;
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
