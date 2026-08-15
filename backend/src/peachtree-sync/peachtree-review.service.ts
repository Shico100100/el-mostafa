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

  async markSkippedRow(
    row: NonNullable<Awaited<ReturnType<typeof this.reviewRepo.findOne>>>,
  ): Promise<void> {
    row.status = ReviewStatus.SKIPPED;
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
