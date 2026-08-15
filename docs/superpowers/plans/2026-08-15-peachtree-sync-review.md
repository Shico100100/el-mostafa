# Peachtree Sync Review & Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the Peachtree full sync from deleting/overwriting existing data; instead auto-import new records, route changes on existing records to a reviewable differences report, let the user accept/skip per difference, and persist an audit log of every run.

**Architecture:** Two new persistent tables (`peachtree_sync_review`, `peachtree_sync_log`) + a `PeachtreeReviewService` for diffing/review/log persistence, injected into the existing `PeachtreeSyncService`. The sync service stops deleting `[PQ-...]` orders and stops auto-updating existing records; it auto-inserts new records and creates pending review rows for differences. New controller endpoints expose preview/apply/skip/log. The existing peachtree-sync page gets a "تقرير الفروقات" section and a "سجل العمليات" section.

**Tech Stack:** NestJS, TypeORM (PostgreSQL, `synchronize=false` — tables need a migration), Jest (backend), Next.js App Router + Vitest (frontend).

**Spec:** `docs/superpowers/specs/2026-08-15-peachtree-sync-review-design.md`

## Global Constraints

- No deletions anywhere in the sync flow. The full-sync deletion of `[PQ-...]` orders is removed permanently.
- Existing records with changed values become pending review rows — never auto-updated.
- New records are auto-inserted immediately.
- All UI text is Arabic, matching the existing page.
- No new dependencies. Follow existing patterns (entity files, migration style, in-memory sync status, `api.fetchWithAuth`, `toast` from `sonner`).
- Backend tests: `cd backend && npm test -- peachtree` (or `npm test`). Frontend tests: `cd frontend && npm test`. Typecheck: `npm run typecheck` in each of `backend` and `frontend`.

---

### Task 1: Review + Log entities and migration

**Files:**
- Create: `backend/src/peachtree-sync/entities/peachtree-sync-review.entity.ts`
- Create: `backend/src/peachtree-sync/entities/peachtree-sync-log.entity.ts`
- Create: `backend/src/database/migrations/1786000000000-CreatePeachtreeSyncReviewAndLog.ts`
- Modify: `backend/src/database/data-source.ts` (no change needed — entity glob covers new files)

**Interfaces:**
- Produces: `PeachtreeSyncReview` (table `peachtree_sync_review`), `PeachtreeSyncLog` (table `peachtree_sync_log`), enums `ReviewStatus` (`pending|accepted|skipped`), `SyncLogAction` (`inserted|different|skipped|missing|updated|skipped_review`).

- [ ] **Step 1: Write the review entity**

`backend/src/peachtree-sync/entities/peachtree-sync-review.entity.ts`:

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum ReviewStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  SKIPPED = 'skipped',
}

@Entity('peachtree_sync_review')
export class PeachtreeSyncReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entity: string;

  @Column()
  record_key: string;

  @Column()
  change_type: string;

  @Column({ type: 'int', nullable: true })
  db_record_id: number | null;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @Column({ default: ReviewStatus.PENDING })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  decided_at: Date | null;
}
```

- [ ] **Step 2: Write the log entity**

`backend/src/peachtree-sync/entities/peachtree-sync-log.entity.ts`:

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum SyncLogAction {
  INSERTED = 'inserted',
  DIFFERENT = 'different',
  SKIPPED = 'skipped',
  MISSING = 'missing',
  UPDATED = 'updated',
  SKIPPED_REVIEW = 'skipped_review',
}

@Entity('peachtree_sync_log')
export class PeachtreeSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  run_id: string;

  @Column()
  triggered_by: string;

  @Column()
  entity: string;

  @Column()
  action: string;

  @Column()
  record_key: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 3: Write the migration**

`backend/src/database/migrations/1786000000000-CreatePeachtreeSyncReviewAndLog.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeachtreeSyncReviewAndLog1786000000000
  implements MigrationInterface
{
  name = 'CreatePeachtreeSyncReviewAndLog1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_review" (
        "id" SERIAL NOT NULL,
        "entity" character varying NOT NULL,
        "record_key" character varying NOT NULL,
        "change_type" character varying NOT NULL,
        "db_record_id" integer,
        "old_values" jsonb,
        "new_values" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP,
        CONSTRAINT "PK_peachtree_sync_review" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_log" (
        "id" SERIAL NOT NULL,
        "run_id" character varying NOT NULL,
        "triggered_by" character varying NOT NULL,
        "entity" character varying NOT NULL,
        "action" character varying NOT NULL,
        "record_key" character varying NOT NULL,
        "changes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_peachtree_sync_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_review_status" ON "peachtree_sync_review" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_log_run" ON "peachtree_sync_log" ("run_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_review"`);
  }
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors (new files compile).

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/peachtree-sync/entities src/database/migrations/1786000000000-CreatePeachtreeSyncReviewAndLog.ts && git commit -m "feat(peachtree): add review and sync-log entities + migration"
```

---

### Task 2: PeachtreeReviewService (diff + review + log persistence)

**Files:**
- Create: `backend/src/peachtree-sync/peachtree-review.service.ts`
- Create: `backend/test/peachtree-review.unit.spec.ts`

**Interfaces:**
- Consumes: `PeachtreeSyncReview`, `PeachtreeSyncLog`, `SyncEntity`.
- Produces:
  - `normalizeValue(value: unknown): unknown`
  - `computeDiff(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): DiffChange[]` where `DiffChange = { field: string; old: unknown; new: unknown }`
  - `createReview(input: { entity: SyncEntity; recordKey: string; changeType: 'update' | 'missing'; dbRecordId?: number | null; oldValues: Record<string, unknown>; newValues: Record<string, unknown> }): Promise<PeachtreeSyncReview>`
  - `log(input: { runId: string; triggeredBy: string; entity: SyncEntity; action: SyncLogAction; recordKey: string; changes?: DiffChange[] | null }): Promise<PeachtreeSyncLog>`
  - `getPendingReview(entity?: SyncEntity): Promise<PeachtreeSyncReview[]>`
  - `getPendingByIds(ids: number[]): Promise<PeachtreeSyncReview[]>`
  - `getReviewLog(runId?: string): Promise<PeachtreeSyncLog[]>`
  - `markSkipped(ids: number[]): Promise<number>`
  - `markAccepted(row: PeachtreeSyncReview): Promise<void>`
  - `clearPendingForEntity(entity: SyncEntity): Promise<void>`

- [ ] **Step 1: Write the failing tests**

`backend/test/peachtree-review.unit.spec.ts`:

```typescript
import { PeachtreeReviewService } from '../src/peachtree-sync/peachtree-review.service';
import { PeachtreeSyncReview, ReviewStatus } from '../src/peachtree-sync/entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog, SyncLogAction } from '../src/peachtree-sync/entities/peachtree-sync-log.entity';
import { SyncEntity } from '../src/peachtree-sync/dto/sync-status.dto';

function buildService() {
  const reviewRepo: any = {
    create: jest.fn((input: any) => input),
    save: jest.fn(async (row: any) => ({ id: 1, ...row })),
    find: jest.fn().mockResolvedValue([]),
  };
  const logRepo: any = {
    create: jest.fn((input: any) => input),
    save: jest.fn(async (row: any) => ({ id: 1, ...row })),
    find: jest.fn().mockResolvedValue([]),
  };
  const service = new PeachtreeReviewService(reviewRepo, logRepo);
  return { service, reviewRepo, logRepo };
}

describe('PeachtreeReviewService', () => {
  describe('computeDiff', () => {
    it('detects no changes when objects are equal', () => {
      const { service } = buildService();
      expect(
        service.computeDiff({ name: 'X', balance: 10 }, { name: 'X', balance: 10 }),
      ).toEqual([]);
    });

    it('normalizes numbers stored as strings', () => {
      const { service } = buildService();
      expect(
        service.computeDiff({ balance: 10 }, { balance: '10' }),
      ).toEqual([]);
    });

    it('detects changed fields', () => {
      const { service } = buildService();
      const changes = service.computeDiff(
        { name: 'X', phone: '111', email: '' },
        { name: 'X', phone: '222', email: 'a@b.c' },
      );
      expect(changes).toEqual([
        { field: 'phone', old: '111', new: '222' },
        { field: 'email', old: '', new: 'a@b.c' },
      ]);
    });

    it('treats null/undefined as empty string', () => {
      const { service } = buildService();
      expect(service.computeDiff({ a: null }, { a: '' })).toEqual([]);
    });
  });

  describe('createReview', () => {
    it('creates a pending review row', async () => {
      const { service, reviewRepo } = buildService();
      const row = await service.createReview({
        entity: SyncEntity.CUSTOMERS,
        recordKey: 'Acme',
        changeType: 'update',
        dbRecordId: 5,
        oldValues: { phone: '1' },
        newValues: { phone: '2' },
      });
      expect(reviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'customers',
          record_key: 'Acme',
          change_type: 'update',
          db_record_id: 5,
          status: ReviewStatus.PENDING,
        }),
      );
      expect(row.status).toBe(ReviewStatus.PENDING);
    });
  });

  describe('log', () => {
    it('stores changes as {field: [old, new]} map', async () => {
      const { service, logRepo } = buildService();
      await service.log({
        runId: 'sync_1',
        triggeredBy: 'manual',
        entity: SyncEntity.PRODUCTS,
        action: SyncLogAction.DIFFERENT,
        recordKey: 'SKU-1',
        changes: [
          { field: 'price', old: 10, new: 15 },
          { field: 'name', old: 'A', new: 'B' },
        ],
      });
      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          run_id: 'sync_1',
          action: 'different',
          changes: { price: [10, 15], name: ['A', 'B'] },
        }),
      );
    });
  });

  describe('markSkipped / clearPendingForEntity', () => {
    it('marks pending rows skipped', async () => {
      const { service, reviewRepo } = buildService();
      reviewRepo.find.mockResolvedValue([
        { id: 1, status: ReviewStatus.PENDING },
        { id: 2, status: ReviewStatus.PENDING },
      ]);
      const count = await service.markSkipped([1, 2]);
      expect(count).toBe(2);
      expect(reviewRepo.save).toHaveBeenCalledTimes(2);
    });

    it('clears pending rows for an entity', async () => {
      const { service, reviewRepo } = buildService();
      const qb: any = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      reviewRepo.createQueryBuilder = jest.fn(() => qb);
      await service.clearPendingForEntity(SyncEntity.CUSTOMERS);
      expect(qb.where).toHaveBeenCalledWith(
        'entity = :entity AND status = :status',
        { entity: 'customers', status: 'pending' },
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest test/peachtree-review.unit.spec.ts -v`
Expected: FAIL — module `./peachtree-review.service` cannot be found.

- [ ] **Step 3: Write the implementation**

`backend/src/peachtree-sync/peachtree-review.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  PeachtreeSyncReview,
  ReviewStatus,
} from './entities/peachtree-sync-review.entity';
import {
  PeachtreeSyncLog,
  SyncLogAction,
} from './entities/peachtree-sync-log.entity';
import { SyncEntity } from './dto/sync-status.dto';

export interface DiffChange {
  field: string;
  old: unknown;
  new: unknown;
}

export interface ReviewCreateInput {
  entity: SyncEntity;
  recordKey: string;
  changeType: 'update' | 'missing';
  dbRecordId?: number | null;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface LogCreateInput {
  runId: string;
  triggeredBy: string;
  entity: SyncEntity;
  action: SyncLogAction;
  recordKey: string;
  changes?: DiffChange[] | null;
}

@Injectable()
export class PeachtreeReviewService {
  private readonly logger = new Logger(PeachtreeReviewService.name);

  constructor(
    @InjectRepository(PeachtreeSyncReview)
    private reviewRepo: Repository<PeachtreeSyncReview>,
    @InjectRepository(PeachtreeSyncLog)
    private logRepo: Repository<PeachtreeSyncLog>,
  ) {}

  normalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return value;
    const str = String(value).trim();
    const num = parseFloat(str);
    if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(str)) return num;
    return str;
  }

  computeDiff(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
  ): DiffChange[] {
    const changes: DiffChange[] = [];
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    for (const key of keys) {
      const o = this.normalizeValue(oldObj[key]);
      const n = this.normalizeValue(newObj[key]);
      if (o !== n) {
        changes.push({ field: key, old: oldObj[key], new: newObj[key] });
      }
    }
    return changes;
  }

  async createReview(input: ReviewCreateInput): Promise<PeachtreeSyncReview> {
    const row = this.reviewRepo.create({
      entity: input.entity,
      record_key: input.recordKey,
      change_type: input.changeType,
      db_record_id: input.dbRecordId ?? null,
      old_values: input.oldValues,
      new_values: input.newValues,
      status: ReviewStatus.PENDING,
    });
    return this.reviewRepo.save(row);
  }

  async log(input: LogCreateInput): Promise<PeachtreeSyncLog> {
    const row = this.logRepo.create({
      run_id: input.runId,
      triggered_by: input.triggeredBy,
      entity: input.entity,
      action: input.action,
      record_key: input.recordKey,
      changes: input.changes
        ? Object.fromEntries(
            input.changes.map((c) => [c.field, [c.old, c.new]]),
          )
        : null,
    });
    return this.logRepo.save(row);
  }

  async getPendingReview(entity?: SyncEntity): Promise<PeachtreeSyncReview[]> {
    const where: Record<string, unknown> = { status: ReviewStatus.PENDING };
    if (entity) where.entity = entity;
    return this.reviewRepo.find({ where, order: { id: 'ASC' } });
  }

  async getPendingByIds(ids: number[]): Promise<PeachtreeSyncReview[]> {
    return this.reviewRepo.find({
      where: { id: In(ids), status: ReviewStatus.PENDING },
    });
  }

  async getReviewLog(runId?: string): Promise<PeachtreeSyncLog[]> {
    if (runId) {
      return this.logRepo.find({ where: { run_id: runId }, order: { id: 'ASC' } });
    }
    return this.logRepo.find({ order: { id: 'DESC' }, take: 500 });
  }

  async markSkipped(ids: number[]): Promise<number> {
    const rows = await this.reviewRepo.find({
      where: { id: In(ids), status: ReviewStatus.PENDING },
    });
    for (const row of rows) {
      row.status = ReviewStatus.SKIPPED;
      row.decided_at = new Date();
      await this.reviewRepo.save(row);
    }
    return rows.length;
  }

  async markAccepted(row: PeachtreeSyncReview): Promise<void> {
    row.status = ReviewStatus.ACCEPTED;
    row.decided_at = new Date();
    await this.reviewRepo.save(row);
  }

  async clearPendingForEntity(entity: SyncEntity): Promise<void> {
    await this.reviewRepo
      .createQueryBuilder()
      .delete()
      .where('entity = :entity AND status = :status', {
        entity,
        status: ReviewStatus.PENDING,
      })
      .execute();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest test/peachtree-review.unit.spec.ts -v`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-review.service.ts test/peachtree-review.unit.spec.ts && git commit -m "feat(peachtree): add PeachtreeReviewService with diff/review/log persistence"
```

---

### Task 3: Wire module (entities + review service)

**Files:**
- Modify: `backend/src/peachtree-sync/peachtree-sync.module.ts`

**Interfaces:**
- Consumes: `PeachtreeSyncReview`, `PeachtreeSyncLog`, `PeachtreeReviewService` (from Task 2).
- Produces: `PeachtreeSyncModule` provides `PeachtreeReviewService` and registers both new repos.

- [ ] **Step 1: Add imports and registrations**

Edit `backend/src/peachtree-sync/peachtree-sync.module.ts`:

```typescript
import { PeachtreeReviewService } from './peachtree-review.service';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
```

Then inside `TypeOrmModule.forFeature([...])` add `PeachtreeSyncReview` and `PeachtreeSyncLog`, and in `providers: [...]` add `PeachtreeReviewService`:

```typescript
    TypeOrmModule.forFeature([
      Customer,
      Supplier,
      Product,
      SalesOrder,
      SalesOrderItem,
      PurchaseOrder,
      PurchaseOrderItem,
      PeachtreeSyncReview,
      PeachtreeSyncLog,
    ]),
  ],
  controllers: [PeachtreeSyncController],
  providers: [
    PeachtreeConnectionService,
    PeachtreeMappingService,
    PeachtreeSyncService,
    PeachtreeSyncScheduler,
    PeachtreeReviewService,
  ],
```

- [ ] **Step 2: Verify compile + lint**

Run: `cd backend && npm run typecheck && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-sync.module.ts && git commit -m "feat(peachtree): register review/log entities and PeachtreeReviewService"
```

---

### Task 4: Sync service — master data classification (customers/suppliers/products) + remove order deletion

**Files:**
- Modify: `backend/src/peachtree-sync/peachtree-sync.service.ts`

**Interfaces:**
- Consumes: `PeachtreeReviewService` (Task 2), `SyncLogAction`.
- Produces (changed signatures used by later tasks):
  - `syncCustomers(result: SyncResultDto, runId: string): Promise<void>`
  - `syncSuppliers(result: SyncResultDto, runId: string): Promise<void>`
  - `syncProducts(result: SyncResultDto, runId: string): Promise<void>`
  - `runSync` no longer deletes `[PQ-...]` orders.

- [ ] **Step 1: Update imports and constructor**

In `backend/src/peachtree-sync/peachtree-sync.service.ts`:
- Add imports:

```typescript
import { PeachtreeReviewService } from './peachtree-review.service';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';
```

- Add a constructor parameter (last position) `private reviewService: PeachtreeReviewService`.

- [ ] **Step 2: Remove the order-deletion block in runSync**

In `runSync`, delete the entire block:

```typescript
    if (mode === 'full') {
      // Clear existing Peachtree-synced orders so invoice_numbers can be recreated ...
      ...
    } else {
      this.logger.log(
        'Incremental mode: keeping existing Peachtree orders, only importing missing records',
      );
    }
```

Replace it with:

```typescript
    this.logger.log(
      `Sync ${syncId} started (mode: ${mode}) — no deletions, differences routed to review`,
    );
```

This keeps `mode` referenced (no unused-variable lint error).

- [ ] **Step 3: Pass runId through syncEntity**

Change the entity loop in `runSync` and `runSyncPartial` from `await this.syncEntity(entity);` to `await this.syncEntity(entity, syncId);`.

Change the signature and the switch cases:

```typescript
  private async syncEntity(
    entity: SyncEntity,
    runId: string,
  ): Promise<SyncResultDto> {
    ...
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
    ...
```

- [ ] **Step 4: Rewrite syncCustomers**

Replace the whole `syncCustomers` method:

```typescript
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
```

- [ ] **Step 5: Rewrite syncSuppliers**

Replace the whole `syncSuppliers` method using the same shape as `syncCustomers`, substituting: query `'Vendors'`, `mapSupplier`, `supplierRepo`, `SyncEntity.SUPPLIERS`, and `Supplier` in the insert:

```typescript
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
```

- [ ] **Step 6: Rewrite syncProducts**

Replace the whole `syncProducts` method:

```typescript
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
      where: [
        { sku: In(skus) },
        { name: In(names) },
      ],
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
```

- [ ] **Step 7: Update the existing pipeline test harness**

In `backend/test/peachtree-sync.unit.spec.ts`, in `buildService()` (the `PeachtreeSyncService pipeline` describe), add a `reviewService` mock before constructing the service, and pass it as the 9th argument:

```typescript
    const reviewService: any = {
      clearPendingForEntity: jest.fn().mockResolvedValue(undefined),
      createReview: jest.fn().mockResolvedValue({ id: 1 }),
      log: jest.fn().mockResolvedValue({ id: 1 }),
      computeDiff: (oldObj: any, newObj: any) => {
        const changes: any[] = [];
        for (const k of new Set([
          ...Object.keys(oldObj),
          ...Object.keys(newObj),
        ])) {
          if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
            changes.push({ field: k, old: oldObj[k], new: newObj[k] });
          }
        }
        return changes;
      },
      getPendingByIds: jest.fn().mockResolvedValue([]),
    };

    const service = new PeachtreeSyncService(
      connectionService,
      new PeachtreeMappingService(),
      customerRepo,
      supplierRepo,
      productRepo,
      salesOrderRepo,
      salesOrderItemRepo,
      purchaseOrderRepo,
      purchaseOrderItemRepo,
      reviewService,
    );
```

- [ ] **Step 8: Add a no-deletion regression test**

In the same describe, add:

```typescript
    it('should NOT delete existing PQ orders during a full sync', async () => {
      const { service, salesOrderRepo } = buildService();
      salesOrderRepo.remove = jest.fn();
      salesOrderRepo.find.mockResolvedValue([{ id: 77, notes: '[PQ-1_2_3] x' }]);
      await service.runSync('manual', 'full');
      expect(salesOrderRepo.remove).not.toHaveBeenCalled();
    });
```

- [ ] **Step 9: Run the peachtree tests**

Run: `cd backend && npx jest test/peachtree-sync.unit.spec.ts -v`
Expected: PASS — including the new no-deletion test and the existing pipeline tests (they now go through the reviewService mock).

- [ ] **Step 10: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-sync.service.ts test/peachtree-sync.unit.spec.ts && git commit -m "feat(peachtree): classify master-data diffs into review rows, stop deleting PQ orders"
```

---

### Task 5: Sync service — orders and line items classification + missing detection

**Files:**
- Modify: `backend/src/peachtree-sync/peachtree-sync.service.ts`

**Interfaces:**
- Consumes: helpers from Task 4 (`syncEntity(entity, runId)`), `PeachtreeReviewService`.
- Produces (used by Task 6):
  - `syncSalesInvoices(result: SyncResultDto, runId: string): Promise<void>`
  - `syncPurchaseInvoices(result: SyncResultDto, runId: string): Promise<void>`
  - `syncInvoiceLineItems(result: SyncResultDto, runId: string): Promise<void>`
  - Private helpers `compareOrderToReview`, `flagMissingOrders`, `buildExpectedItems`, `itemsEqual`.

- [ ] **Step 1: Add private helpers**

Add these private methods to `PeachtreeSyncService` (place them just before `syncCustomers`):

```typescript
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
        ? existing.order_date.toISOString()
        : '',
      notes: existing.notes || '',
    };
    const newObj = {
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      order_date: newOrder.order_date
        ? newOrder.order_date.toISOString()
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
    }
  }

  private buildExpectedItems(
    rows: any[],
    orderId: number,
    recordToProduct: Map<number, number>,
  ): any[] {
    const items: any[] = [];
    for (const row of rows) {
      const recNo = parseInt(row.ItemRecordNumber, 10);
      const productId = recordToProduct.get(recNo) || 0;
      if (!productId) continue;
      const qty = Math.abs(parseFloat(row.Quantity || '0') || 1);
      const price = Math.abs(parseFloat(row.UnitCost || '0') || 0);
      const amt = Math.abs(parseFloat(row.Amount || '0') || 0);
      if (qty <= 0 && price <= 0 && amt <= 0) continue;
      items.push({
        order_id: orderId,
        product_id: productId,
        quantity: qty || 1,
        price: price || 0,
        total: amt || qty * price,
      });
    }
    return items;
  }

  private itemsEqual(a: any[], b: any[]): boolean {
    const norm = (list: any[]) =>
      list
        .map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity) || 0,
          price: Number(i.price) || 0,
          total: Number(i.total) || 0,
        }))
        .sort(
          (x, y) =>
            x.product_id - y.product_id ||
            x.quantity - y.quantity ||
            x.price - y.price,
        );
    return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
  }
```

- [ ] **Step 2: Rewrite syncSalesInvoices**

Replace the whole `syncSalesInvoices` method:

```typescript
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
```

- [ ] **Step 3: Rewrite syncPurchaseInvoices**

Replace the whole `syncPurchaseInvoices` method using the same shape as `syncSalesInvoices`, substituting: `syncPurchaseInvoices`, `SyncEntity.PURCHASE_INVOICES`, `supplierRepo`, `Supplier`, `Vendors`, `VendorRecordNumber, Name, VendorID`, `mapPurchaseInvoice`, `purchaseOrderRepo`, `PurchaseOrder`, module `'P'`, and `flagMissingOrders(SyncEntity.PURCHASE_INVOICES, 'P', result, runId)`.

- [ ] **Step 4: Add the differences pass to syncInvoiceLineItems**

In `syncInvoiceLineItems`, change the signature to `(result: SyncResultDto, runId: string)` and at the top add:

```typescript
    await this.reviewService.clearPendingForEntity(
      SyncEntity.INVOICE_LINE_ITEMS,
    );
```

Then replace the `const existingSalesItems = await this.salesOrderItemRepo.find({ select: ['order_id'] });` / `existingPurchaseItems` block with one that also loads full items for comparison:

```typescript
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
```

Then replace the grouping loop (from `for (const [postOrder, rows] of rowsByPostOrder) {` through the closing `}` before `this.logger.log(`PostOrder links...`)`) with:

```typescript
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
```

Note: `salesBatch`/`purchaseBatch` declarations (`const salesBatch: any[] = [];` etc.) and the `salesLinksFound`/`purchaseLinksFound`/`productMissCount` counters and the old log lines that reference them must be removed/adjusted. Replace that block:

```typescript
    const salesBatch: any[] = [];
    const purchaseBatch: any[] = [];
```

and delete `let salesLinksFound = 0; let purchaseLinksFound = 0; let productMissCount = 0;` and the old `this.logger.log(\`PostOrder links: ...\`)` line.

- [ ] **Step 5: Add tests for order/line-item classification**

In `backend/test/peachtree-sync.unit.spec.ts` pipeline describe, add:

```typescript
    it('should create a review row when an existing invoice total differs', async () => {
      const { service, salesOrderRepo } = buildService();
      salesOrderRepo.find.mockImplementation((opts: any) => {
        if (opts?.select?.includes('invoice_number')) {
          return Promise.resolve([
            {
              id: 77,
              invoice_number: 'INV-90001',
              total_amount: 999,
              status: 'PENDING',
              order_date: null,
              notes: '[PQ-90001_202607_1] Acme Corp',
            },
          ]);
        }
        return Promise.resolve([]);
      });
      const reviewService: any = (service as any).reviewService;
      reviewService.clearPendingForEntity.mockResolvedValue(undefined);

      const status = await service.runSyncPartial(
        [SyncEntity.SALES_INVOICES],
        'test',
      );
      const salesResult = status.results[0];
      expect(salesResult.recordsCreated).toBe(0);
      expect(salesResult.recordsUpdated).toBe(1);
      expect(reviewService.createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'sales_invoices',
          changeType: 'update',
          dbRecordId: 77,
        }),
      );
    });
```

- [ ] **Step 6: Run the peachtree tests**

Run: `cd backend && npx jest test/peachtree-sync.unit.spec.ts -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-sync.service.ts test/peachtree-sync.unit.spec.ts && git commit -m "feat(peachtree): route invoice and line-item differences to review, flag missing orders"
```

---

### Task 6: Sync service — preview/apply/skip/getReview/getLog orchestration

**Files:**
- Modify: `backend/src/peachtree-sync/peachtree-sync.service.ts`

**Interfaces:**
- Consumes: Task 4/5 sync methods, `PeachtreeReviewService`, `PeachtreeSyncReview`.
- Produces (used by Task 7 controller):
  - `preview(triggeredBy?: string): Promise<SyncStatusResponseDto>`
  - `getReview(entity?: SyncEntity): Promise<PeachtreeSyncReview[]>`
  - `getLog(runId?: string): Promise<PeachtreeSyncLog[]>`
  - `applyReview(ids: number[]): Promise<{ applied: number; errors: string[] }>`
  - `skipReview(ids: number[]): Promise<{ skipped: number }>`

- [ ] **Step 1: Add imports**

Add to the imports in `peachtree-sync.service.ts`:

```typescript
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
```

- [ ] **Step 2: Add the new public methods**

Add these methods to `PeachtreeSyncService` (before `getSyncHistory`):

```typescript
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
  ): Promise<{ skipped: number }> {
    const runId = `skip_${Date.now()}`;
    const skipped = await this.reviewService.markSkipped(ids || []);
    for (const id of ids || []) {
      const [row] = await this.reviewService.getPendingByIds([id]);
      if (!row || row.status !== 'skipped') continue;
      await this.reviewService.log({
        runId,
        triggeredBy: 'skip',
        entity: row.entity as SyncEntity,
        action: SyncLogAction.SKIPPED_REVIEW,
        recordKey: row.record_key,
      });
    }
    return { skipped };
  }

  async applyReview(
    ids: number[],
  ): Promise<{ applied: number; errors: string[] }> {
    const rows = await this.reviewService.getPendingByIds(ids || []);
    const runId = `apply_${Date.now()}`;
    let applied = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        if (row.change_type === 'missing') {
          await this.reviewService.markAccepted(row);
          continue;
        }
        const nv = row.new_values || {};
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
            if (row.db_record_id && Array.isArray(nv.items)) {
              if (nv.kind === 'purchase') {
                await this.purchaseOrderItemRepo.delete({
                  order_id: row.db_record_id,
                });
                if (nv.items.length > 0) {
                  await this.purchaseOrderItemRepo.insert(nv.items);
                }
              } else {
                await this.salesOrderItemRepo.delete({
                  order_id: row.db_record_id,
                });
                if (nv.items.length > 0) {
                  await this.salesOrderItemRepo.insert(nv.items);
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
```

- [ ] **Step 3: Add tests**

In `backend/test/peachtree-sync.unit.spec.ts`, add a new describe block after the pipeline describe:

```typescript
describe('PeachtreeSyncService review orchestration', () => {
  function buildService() {
    const reviewRow = {
      id: 1,
      entity: 'customers',
      record_key: 'Acme',
      change_type: 'update',
      db_record_id: 5,
      old_values: { phone: '111' },
      new_values: { phone: '222' },
      status: 'pending',
    };
    const reviewRepo: any = {
      find: jest.fn().mockResolvedValue([reviewRow]),
      save: jest.fn(async (r: any) => r),
    };
    const logRepo: any = { save: jest.fn(async (r: any) => r) };
    const reviewService = new PeachtreeReviewService(reviewRepo, logRepo);
    const customerRepo: any = { update: jest.fn().mockResolvedValue({}) };
    const service = new PeachtreeSyncService(
      {} as any,
      new PeachtreeMappingService(),
      customerRepo,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      {} as any,
      { update: jest.fn() } as any,
      {} as any,
      reviewService,
    );
    return { service, customerRepo, reviewRepo, logRepo };
  }

  it('applies an accepted review row and flips its status', async () => {
    const { service, customerRepo, reviewRepo, logRepo } = buildService();
    const result = await service.applyReview([1]);
    expect(result.applied).toBe(1);
    expect(customerRepo.update).toHaveBeenCalledWith(5, { phone: '222' });
    expect(reviewRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );
    expect(logRepo.save).toHaveBeenCalled();
  });

  it('skips review rows and logs the decision', async () => {
    const { service, reviewRepo, logRepo } = buildService();
    const result = await service.skipReview([1]);
    expect(result.skipped).toBe(1);
    expect(reviewRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'skipped' }),
    );
    expect(logRepo.save).toHaveBeenCalled();
  });
});
```

Add the imports at the top of that block:

```typescript
import { PeachtreeReviewService } from '../src/peachtree-sync/peachtree-review.service';
```

(place next to the existing imports in the file).

- [ ] **Step 4: Run the tests**

Run: `cd backend && npx jest test/peachtree-sync.unit.spec.ts test/peachtree-review.unit.spec.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-sync.service.ts test/peachtree-sync.unit.spec.ts && git commit -m "feat(peachtree): add preview/apply/skip/log orchestration to sync service"
```

---

### Task 7: Controller endpoints

**Files:**
- Modify: `backend/src/peachtree-sync/peachtree-sync.controller.ts`
- Modify: `backend/test/peachtree-sync.unit.spec.ts`

**Interfaces:**
- Consumes: `PeachtreeSyncService` methods from Task 6.
- Produces:
  - `POST /peachtree-sync/preview`
  - `GET /peachtree-sync/review`
  - `POST /peachtree-sync/review/apply`
  - `POST /peachtree-sync/review/skip`
  - `GET /peachtree-sync/log`

- [ ] **Step 1: Add Query import**

Edit `backend/src/peachtree-sync/peachtree-sync.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Body, Query, Logger } from '@nestjs/common';
```

- [ ] **Step 2: Add endpoints**

Add these methods to `PeachtreeSyncController` (after `resyncItems`):

```typescript
  @Post('preview')
  preview() {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') {
      return {
        message: 'Sync already in progress',
        id: current.id,
        status: current.status,
      };
    }
    this.syncService.preview('manual-preview').catch((err) => {
      this.logger.error('Background preview crashed', err?.stack || err);
    });
    return { message: 'Preview started', status: 'running' };
  }

  @Get('review')
  async getReview(@Query() query: { entity?: string }) {
    return this.syncService.getReview(
      (query.entity as SyncEntity) || undefined,
    );
  }

  @Post('review/apply')
  async applyReview(@Body() body: { ids?: number[] }) {
    return this.syncService.applyReview(body?.ids || []);
  }

  @Post('review/skip')
  async skipReview(@Body() body: { ids?: number[] }) {
    return this.syncService.skipReview(body?.ids || []);
  }

  @Get('log')
  async getLog(@Query() query: { runId?: string }) {
    return this.syncService.getLog(query.runId);
  }
```

- [ ] **Step 3: Add controller tests**

In `backend/test/peachtree-sync.unit.spec.ts` `PeachtreeSyncController` describe, add the new methods to the mocked `syncService` object:

```typescript
      preview: jest.fn().mockResolvedValue({ id: 'p1' }),
      getReview: jest.fn().mockResolvedValue([]),
      applyReview: jest.fn().mockResolvedValue({ applied: 1, errors: [] }),
      skipReview: jest.fn().mockResolvedValue({ skipped: 2 }),
      getLog: jest.fn().mockResolvedValue([]),
```

And add these tests:

```typescript
  describe('POST /preview', () => {
    it('starts a preview when not running', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      const result = await controller.preview();
      expect(result.status).toBe('running');
      expect(syncService.preview).toHaveBeenCalledWith('manual-preview');
    });

    it('rejects if sync already running', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 'x',
        status: 'running',
      } as any);
      const result = await controller.preview();
      expect(syncService.preview).not.toHaveBeenCalled();
      expect(result.message).toContain('already in progress');
    });
  });

  describe('GET /review', () => {
    it('returns pending review rows', async () => {
      syncService.getReview.mockResolvedValue([{ id: 1 }] as any);
      expect(await controller.getReview({})).toEqual([{ id: 1 }]);
      expect(syncService.getReview).toHaveBeenCalledWith(undefined);
    });

    it('filters by entity', async () => {
      await controller.getReview({ entity: 'customers' });
      expect(syncService.getReview).toHaveBeenCalledWith('customers');
    });
  });

  describe('POST /review/apply', () => {
    it('applies selected ids', async () => {
      const result = await controller.applyReview({ ids: [1, 2] });
      expect(result).toEqual({ applied: 1, errors: [] });
      expect(syncService.applyReview).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('POST /review/skip', () => {
    it('skips selected ids', async () => {
      expect(await controller.skipReview({ ids: [1] })).toEqual({ skipped: 2 });
    });
  });

  describe('GET /log', () => {
    it('returns audit log', async () => {
      syncService.getLog.mockResolvedValue([{ id: 1 }] as any);
      expect(await controller.getLog({})).toEqual([{ id: 1 }]);
    });
  });
```

- [ ] **Step 4: Run the tests**

Run: `cd backend && npx jest test/peachtree-sync.unit.spec.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/peachtree-sync/peachtree-sync.controller.ts test/peachtree-sync.unit.spec.ts && git commit -m "feat(peachtree): expose preview/review/apply/skip/log endpoints"
```

---

### Task 8: Frontend hook — preview, review, apply, skip, log

**Files:**
- Modify: `frontend/hooks/peachtree-sync/usePeachtreeSync.ts`
- Modify: `frontend/hooks/peachtree-sync/usePeachtreeSync.vitest.ts`

**Interfaces:**
- Consumes: existing `api.fetchWithAuth`, `toast`.
- Produces (used by Task 9 page):
  - Types `ReviewEntry`, `LogEntry`
  - Hook fields `review: ReviewEntry[]`, `logs: LogEntry[]`, `previewing: boolean`, `applying: boolean`
  - Hook methods `previewSync()`, `applyReview(ids: number[])`, `skipReview(ids: number[])`, `loadReview()`, `loadLogs()`

- [ ] **Step 1: Add types and state**

In `frontend/hooks/peachtree-sync/usePeachtreeSync.ts` add:

```typescript
export interface ReviewEntry {
  id: number;
  entity: string;
  record_key: string;
  change_type: 'update' | 'missing';
  db_record_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  status: string;
  created_at?: string;
}

export interface LogEntry {
  id: number;
  run_id: string;
  triggered_by: string;
  entity: string;
  action: string;
  record_key: string;
  changes: Record<string, [unknown, unknown]> | null;
  created_at?: string;
}
```

Add state inside the hook:

```typescript
  const [review, setReview] = useState<ReviewEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
```

- [ ] **Step 2: Load review + log in loadData**

Change `loadData` to fetch five endpoints:

```typescript
  const loadData = useCallback(async () => {
    try {
      const [historyData, configData, tablesData, reviewData, logData] =
        await Promise.all([
          api.fetchWithAuth<SyncHistoryEntry[]>('/peachtree-sync/status'),
          api.fetchWithAuth<{ dsn: string }>('/peachtree-sync/config'),
          api.fetchWithAuth<string[]>('/peachtree-sync/tables').catch(() => []),
          api.fetchWithAuth<ReviewEntry[]>('/peachtree-sync/review'),
          api.fetchWithAuth<LogEntry[]>('/peachtree-sync/log'),
        ]);
      setHistory(historyData || []);
      setDsn(configData?.dsn || '');
      setTables(tablesData || []);
      setReview(reviewData || []);
      setLogs(logData || []);
    } catch { toast.error('فشل تحميل بيانات المزامنة'); }
    finally { setLoading(false); }
  }, []);
```

- [ ] **Step 3: Add the new methods**

Add before `saveConfig`:

```typescript
  const previewSync = async () => {
    setPreviewing(true);
    try {
      const start = await api.fetchWithAuth<{ message: string; status?: string }>(
        '/peachtree-sync/preview',
        { method: 'POST' },
      );
      if (start.status === 'running') {
        toast.info('بدأت المعاينة في الخلفية...');
        await pollSyncProgress();
      }
      await loadData();
    } catch { toast.error('فشلت المعاينة'); }
    finally { setPreviewing(false); }
  };

  const loadReview = async () => {
    try {
      const data = await api.fetchWithAuth<ReviewEntry[]>('/peachtree-sync/review');
      setReview(data || []);
    } catch { toast.error('فشل تحميل تقرير الفروقات'); }
  };

  const loadLogs = async () => {
    try {
      const data = await api.fetchWithAuth<LogEntry[]>('/peachtree-sync/log');
      setLogs(data || []);
    } catch { /* silent */ }
  };

  const applyReview = async (ids: number[]) => {
    if (!ids.length) return;
    setApplying(true);
    try {
      const result = await api.fetchWithAuth<{ applied: number; errors: string[] }>(
        '/peachtree-sync/review/apply',
        { method: 'POST', body: JSON.stringify({ ids }) },
      );
      toast.success(`تم تطبيق ${result.applied} تغيير`);
      if (result.errors?.length) toast.error(`فشل ${result.errors.length} — ${result.errors[0]}`);
      await loadData();
    } catch { toast.error('فشل تطبيق التغييرات'); }
    finally { setApplying(false); }
  };

  const skipReview = async (ids: number[]) => {
    if (!ids.length) return;
    setApplying(true);
    try {
      const result = await api.fetchWithAuth<{ skipped: number }>(
        '/peachtree-sync/review/skip',
        { method: 'POST', body: JSON.stringify({ ids }) },
      );
      toast.success(`تم تجاهل ${result.skipped} تغيير`);
      await loadData();
    } catch { toast.error('فشل تجاهل التغييرات'); }
    finally { setApplying(false); }
  };
```

- [ ] **Step 4: Return the new values**

Change the return object to add:

```typescript
  return {
    loading, syncing, resyncing, testing, applying, previewing,
    connected, connectionError, history, tables, dsn,
    review, logs,
    setDsn, testConnection, runSync, runIncrementalSync, resyncItems,
    syncInvoices, saveConfig, previewSync, applyReview, skipReview,
    loadReview, loadLogs,
  };
```

- [ ] **Step 5: Update hook tests**

In `frontend/hooks/peachtree-sync/usePeachtreeSync.vitest.ts`, update `mockLoadData` to answer five calls:

```typescript
function mockLoadData(overrides: { tables?: string[]; review?: any[]; logs?: any[] } = {}) {
  mocks.fetchWithAuth
    .mockResolvedValueOnce([{ id: 'sync1', status: 'completed' }])
    .mockResolvedValueOnce({ dsn: 'mos' })
    .mockResolvedValueOnce(overrides.tables ?? ['Chart', 'Customers'])
    .mockResolvedValueOnce(overrides.review ?? [])
    .mockResolvedValueOnce(overrides.logs ?? []);
}
```

Add new tests:

```typescript
  describe('review workflow', () => {
    it('previewSync calls the preview endpoint and reloads', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ status: 'running' });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.previewSync(); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/preview', { method: 'POST' });
    });

    it('applyReview posts selected ids', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ applied: 2, errors: [] });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.applyReview([1, 2]); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/apply', { method: 'POST', body: JSON.stringify({ ids: [1, 2] }) });
      expect(mocks.toastSuccess).toHaveBeenCalledWith('تم تطبيق 2 تغيير');
    });

    it('skipReview posts selected ids', async () => {
      mockLoadData();
      mocks.fetchWithAuth.mockResolvedValueOnce({ skipped: 1 });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.skipReview([3]); });
      expect(mocks.fetchWithAuth).toHaveBeenCalledWith('/peachtree-sync/review/skip', { method: 'POST', body: JSON.stringify({ ids: [3] }) });
    });

    it('loads review and logs on mount', async () => {
      mockLoadData({
        review: [{ id: 1, entity: 'customers', record_key: 'Acme' }],
        logs: [{ id: 9, run_id: 'sync_1', entity: 'products', action: 'inserted' }],
      });
      const { result } = renderHook(() => usePeachtreeSync());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.review).toEqual([{ id: 1, entity: 'customers', record_key: 'Acme' }]);
      expect(result.current.logs).toEqual([{ id: 9, run_id: 'sync_1', entity: 'products', action: 'inserted' }]);
    });
  });
```

Also update existing tests that call `mockLoadData()` — the extra two `mockResolvedValueOnce` calls are now consumed automatically; assertions that only check `history`/`dsn`/`tables` still pass. Verify no test asserts on the exact number of `fetchWithAuth` calls in `loadData`.

- [ ] **Step 6: Run frontend hook tests**

Run: `cd frontend && npx vitest run hooks/peachtree-sync/usePeachtreeSync.vitest.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add hooks/peachtree-sync/usePeachtreeSync.ts hooks/peachtree-sync/usePeachtreeSync.vitest.ts && git commit -m "feat(peachtree): add preview/review/apply/skip/log to sync hook"
```

---

### Task 9: Frontend page — تقرير الفروقات and سجل العمليات

**Files:**
- Modify: `frontend/app/peachtree-sync/page.tsx`
- Modify: `frontend/app/peachtree-sync/page.vitest.tsx`

**Interfaces:**
- Consumes: hook fields/methods from Task 8, existing icons from `lucide-react`, `ENTITY_LABELS`.

- [ ] **Step 1: Add icons and label maps**

In `frontend/app/peachtree-sync/page.tsx`, extend the `lucide-react` import:

```typescript
import {
  Link2, Play, CheckCircle2, XCircle, RefreshCw, Database, Settings,
  Users, Truck, Package, FileText, ChevronDown, ChevronUp, ListChecks, ClipboardList, Check, EyeOff,
  type LucideIcon,
} from 'lucide-react';
```

Add entity + action label maps and a diff helper after `ENTITY_LABELS`:

```typescript
const ACTION_LABELS: Record<string, string> = {
  inserted: 'إضافة جديدة',
  different: 'اختلاف',
  skipped: 'مطابق',
  missing: 'غير موجود في Peachtree',
  updated: 'تم التحديث',
  skipped_review: 'تم التجاهل',
};

function reviewDiff(entry: ReviewEntry): { field: string; old: string; new: string }[] {
  const oldV = entry.old_values || {};
  const newV = entry.new_values || {};
  const keys = new Set([...Object.keys(oldV), ...Object.keys(newV)]);
  const out: { field: string; old: string; new: string }[] = [];
  for (const k of keys) {
    if (k === 'items' || k === 'kind') continue;
    const o = JSON.stringify(oldV[k] ?? '');
    const n = JSON.stringify(newV[k] ?? '');
    if (o !== n) out.push({ field: k, old: String(oldV[k] ?? ''), new: String(newV[k] ?? '') });
  }
  return out;
}
```

Import `ReviewEntry`, `LogEntry` from the hook:

```typescript
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import type { ReviewEntry, LogEntry, SyncHistoryEntry } from '@/hooks/peachtree-sync/usePeachtreeSync';
```

- [ ] **Step 2: Add component state**

Inside the page component:

```typescript
  const [selectedReview, setSelectedReview] = useState<Set<number>>(new Set());
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
```

- [ ] **Step 3: Add the review section JSX**

Insert this block between the connection-config section (line ~119) and the sync-buttons section:

```tsx
        {/* Review Differences */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-400" />تقرير الفروقات
            </h2>
            <div className="flex gap-2 md:mr-auto">
              <button
                onClick={h.previewSync}
                disabled={h.previewing || h.syncing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {h.previewing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                معاينة الفروقات
              </button>
              <button
                onClick={() => h.applyReview([...selectedReview])}
                disabled={h.applying || selectedReview.size === 0}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />تطبيق المحدد ({selectedReview.size})
              </button>
              <button
                onClick={() => h.applyReview(h.review.filter((r) => r.status === 'pending').map((r) => r.id))}
                disabled={h.applying}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                قبول الكل
              </button>
              <button
                onClick={() => h.skipReview(h.review.filter((r) => r.status === 'pending').map((r) => r.id))}
                disabled={h.applying}
                className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />تجاهل الكل
              </button>
            </div>
          </div>

          {h.review.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد فروقات معلقة — اضغط "معاينة الفروقات" للفحص</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="py-3 px-4 text-right" />
                    <th className="py-3 px-4 text-right">الكيان</th>
                    <th className="py-3 px-4 text-right">السجل</th>
                    <th className="py-3 px-4 text-right">النوع</th>
                    <th className="py-3 px-4 text-right">التفاصيل</th>
                    <th className="py-3 px-4 text-right">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {h.review.map((entry) => {
                    const meta = ENTITY_LABELS[entry.entity] || { label: entry.entity, icon: Package, color: 'text-gray-400' };
                    const Icon = meta.icon;
                    const diffs = reviewDiff(entry);
                    const lineItemCount = (entry.change_type === 'update' && entry.entity === 'invoice_line_items')
                      ? [entry.old_values?.items?.length ?? 0, entry.new_values?.items?.length ?? 0]
                      : null;
                    return (
                      <Fragment key={entry.id}>
                        <tr className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedReview.has(entry.id)}
                              onChange={() => {
                                const next = new Set(selectedReview);
                                if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id);
                                setSelectedReview(next);
                              }}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="py-3 px-4 text-white flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${meta.color}`} />{meta.label}
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-mono text-xs">{entry.record_key}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              entry.change_type === 'missing'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}>
                              {entry.change_type === 'missing' ? 'غير موجود في Peachtree' : 'تحديث'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {lineItemCount ? (
                              <span className="text-gray-400">البنود: {lineItemCount[0]} ← {lineItemCount[1]}</span>
                            ) : diffs.length > 0 ? (
                              <button
                                onClick={() => setExpandedSync(expandedSync === `rv-${entry.id}` ? null : `rv-${entry.id}`)}
                                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                              >
                                {expandedSync === `rv-${entry.id}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {diffs.length} حقل
                              </button>
                            ) : <span className="text-gray-500">—</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => h.applyReview([entry.id])}
                                disabled={h.applying || entry.status !== 'pending'}
                                className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() => h.skipReview([entry.id])}
                                disabled={h.applying || entry.status !== 'pending'}
                                className="px-2 py-1 rounded text-xs bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
                              >
                                تجاهل
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedSync === `rv-${entry.id}` && diffs.length > 0 && (
                          <tr key={`${entry.id}-details`}>
                            <td colSpan={6} className="px-6 py-4 bg-black/30">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 border-b border-white/10">
                                    <th className="py-2 text-right">الحقل</th>
                                    <th className="py-2 text-right">القديم</th>
                                    <th className="py-2 text-right">الجديد</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {diffs.map((d) => (
                                    <tr key={d.field} className="border-b border-white/5">
                                      <td className="py-2 text-gray-400">{d.field}</td>
                                      <td className="py-2 text-gray-300">{d.old || '—'}</td>
                                      <td className="py-2 text-green-400">{d.new || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Add the audit log section JSX**

Insert this block after the sync-history section (end of the component, before the final `</div>`):

```tsx
        {/* Audit Log */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-400" />سجل العمليات
            </h2>
            <button onClick={h.loadLogs} className="text-sky-400 hover:text-sky-300 text-sm">
              تحديث السجل
            </button>
          </div>
          {h.logs.length === 0 ? (
            <p className="py-8 text-center text-gray-500">لا توجد عمليات مسجلة بعد</p>
          ) : (
            <div className="divide-y divide-white/5">
              {Object.entries(
                h.logs.reduce<Record<string, LogEntry[]>>((acc, e) => {
                  (acc[e.run_id] ||= []).push(e);
                  return acc;
                }, {}),
              ).map(([runId, events]) => (
                <Fragment key={runId}>
                  <button
                    onClick={() => setExpandedRun(expandedRun === runId ? null : runId)}
                    className="w-full text-right px-6 py-3 hover:bg-white/5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-white font-mono text-xs">{runId}</p>
                      <p className="text-gray-500 text-xs">
                        {events.length} حدث — {events[0].triggered_by}
                        {events[0].created_at ? ` — ${new Date(events[0].created_at).toLocaleString('ar-EG')}` : ''}
                      </p>
                    </div>
                    {expandedRun === runId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedRun === runId && (
                    <div className="px-6 pb-4 bg-black/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10">
                            <th className="py-2 text-right">الكيان</th>
                            <th className="py-2 text-right">الإجراء</th>
                            <th className="py-2 text-right">السجل</th>
                            <th className="py-2 text-right">التغييرات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((e) => {
                            const meta = ENTITY_LABELS[e.entity] || { label: e.entity, icon: Package, color: 'text-gray-400' };
                            const Icon = meta.icon;
                            return (
                              <tr key={e.id} className="border-b border-white/5">
                                <td className="py-2 text-white flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${meta.color}`} />{meta.label}
                                </td>
                                <td className="py-2 text-gray-300">{ACTION_LABELS[e.action] || e.action}</td>
                                <td className="py-2 text-gray-400 font-mono">{e.record_key}</td>
                                <td className="py-2 text-gray-400">
                                  {e.changes
                                    ? Object.entries(e.changes).map(([f, [o, n]]) => (
                                        <span key={f} className="block">
                                          <span className="text-gray-500">{f}:</span> {String(o)} ← {String(n)}
                                        </span>
                                      ))
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
```

- [ ] **Step 5: Update page tests**

In `frontend/app/peachtree-sync/page.vitest.tsx`, add to the lucide mock the new icons used:

```typescript
    ListChecks: (p: LucideProps) => <svg data-testid="icon" {...p} />,
    ClipboardList: (p: LucideProps) => <svg data-testid="icon" {...p} />,
    Check: (p: LucideProps) => <svg data-testid="icon" {...p} />,
    EyeOff: (p: LucideProps) => <svg data-testid="icon" {...p} />,
```

Extend `makeHookState` defaults:

```typescript
    review: [],
    logs: [],
    previewing: false,
    applying: false,
    previewSync: vi.fn().mockResolvedValue(undefined),
    applyReview: vi.fn().mockResolvedValue(undefined),
    skipReview: vi.fn().mockResolvedValue(undefined),
    loadReview: vi.fn().mockResolvedValue(undefined),
    loadLogs: vi.fn().mockResolvedValue(undefined),
```

Add new tests:

```typescript
  describe('تقرير الفروقات', () => {
    it('shows empty state message when no review rows', () => {
      mockedHook.mockReturnValue(makeHookState({ review: [] }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText(/لا توجد فروقات معلقة/)).toBeDefined();
    });

    it('renders review rows grouped with entity labels', () => {
      mockedHook.mockReturnValue(
        makeHookState({
          review: [
            { id: 1, entity: 'customers', record_key: 'Acme', change_type: 'update', db_record_id: 5, old_values: { phone: '111' }, new_values: { phone: '222' }, status: 'pending' },
          ],
        }),
      );
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('تقرير الفروقات')).toBeDefined();
      expect(screen.getByText('العملاء')).toBeDefined();
      expect(screen.getByText('Acme')).toBeDefined();
    });

    it('accepts all pending rows on "قبول الكل"', async () => {
      const applyReview = vi.fn().mockResolvedValue(undefined);
      mockedHook.mockReturnValue(
        makeHookState({
          applyReview,
          review: [
            { id: 1, entity: 'products', record_key: 'SKU-1', change_type: 'update', db_record_id: 9, old_values: { price: 10 }, new_values: { price: 15 }, status: 'pending' },
          ],
        }),
      );
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('قبول الكل'));
      expect(applyReview).toHaveBeenCalledWith([1]);
    });
  });

  describe('سجل العمليات', () => {
    it('shows audit log runs', () => {
      mockedHook.mockReturnValue(
        makeHookState({
          logs: [
            { id: 1, run_id: 'sync_1', triggered_by: 'manual', entity: 'products', action: 'inserted', record_key: 'SKU-1', changes: null },
          ],
        }),
      );
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('سجل العمليات')).toBeDefined();
      expect(screen.getByText('sync_1')).toBeDefined();
    });
  });
```

Note: `makeHookState`'s `review`/`logs` types — annotate them as `ReviewEntry[]`/`LogEntry[]` by importing the types:

```typescript
import type { SyncHistoryEntry, ReviewEntry, LogEntry } from '@/hooks/peachtree-sync/usePeachtreeSync';
```

- [ ] **Step 6: Run frontend tests**

Run: `cd frontend && npx vitest run app/peachtree-sync/page.vitest.tsx hooks/peachtree-sync/usePeachtreeSync.vitest.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add app/peachtree-sync/page.tsx app/peachtree-sync/page.vitest.tsx && git commit -m "feat(peachtree): add review report and audit log sections to sync page"
```

---

### Task 10: Full verification

**Files:**
- None (verification only).

- [ ] **Step 1: Backend typecheck + lint + tests**

Run:
`cd backend && npm run typecheck`
`cd backend && npm run lint`
`cd backend && npm test -- peachtree`

Expected: all pass. If lint flags anything (e.g., unused imports), fix and re-run.

- [ ] **Step 2: Frontend typecheck + lint + tests**

Run:
`cd frontend && npm run typecheck`
`cd frontend && npm run lint`
`cd frontend && npm test`

Expected: all pass. Fix any failures and re-run.

- [ ] **Step 3: Run the migration against the dev DB**

Run:
`cd backend && npm run migration:run`

Expected: `peachtree_sync_review` and `peachtree_sync_log` tables are created (verify with `psql -U postgres -d elmostafa_db -c "\dt peachtree*"`).

- [ ] **Step 4: Commit any verification fixes**

```bash
cd backend && git add -A && git commit -m "chore: fix verification issues from peachtree review feature"
```

- [ ] **Step 5: Manual smoke test**

Start backend (`cd backend && npm run start:dev`) and frontend (`cd frontend && npm run dev`), open `http://localhost:3000/peachtree-sync`:
1. Click **اختبار الاتصال** — should connect (or report the known Pervasive error).
2. Click **معاينة الفروقات** — poll completes, report shows pending rows or the empty state.
3. Select a row and click **تطبيق المحدد** — toast confirms, row disappears from pending list.
4. **قبول الكل** / **تجاهل الكل** — bulk actions work.
5. Expand a run in **سجل العمليات** — events and field diffs render.
6. Confirm no `[PQ-...]` orders were deleted during the full sync.
