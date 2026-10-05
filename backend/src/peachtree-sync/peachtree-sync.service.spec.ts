import {
  SyncEntity,
  SyncResultDto,
  SyncStatus,
  ReviewJobAction,
  ReviewJobStatusDto,
} from './dto/sync-status.dto';
import {
  PeachtreeSyncService,
  toReviewJobRow,
  fromReviewJobRow,
} from './peachtree-sync.service';
import { PeachtreeReviewJob } from './entities/peachtree-review-job.entity';

type Recorder = (a: SyncResultDto[], b: SyncResultDto) => void;

function record(results: SyncResultDto[], result: SyncResultDto): void {
  const fn = (
    PeachtreeSyncService.prototype as unknown as { recordResult: Recorder }
  ).recordResult;
  fn.call({}, results, result);
}

function makeResult(
  entity: SyncEntity,
  o: Partial<SyncResultDto> = {},
): SyncResultDto {
  return {
    entity,
    status: SyncStatus.COMPLETED,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
    ...o,
  };
}

describe('PeachtreeSyncService.recordResult', () => {
  it('should append a new entity result', () => {
    const results: SyncResultDto[] = [];
    record(results, makeResult(SyncEntity.CUSTOMERS, { recordsCreated: 3 }));
    expect(results).toHaveLength(1);
    expect(results[0].entity).toBe(SyncEntity.CUSTOMERS);
    expect(results[0].recordsCreated).toBe(3);
  });

  it('should merge a second result for the same entity instead of duplicating it', () => {
    const results: SyncResultDto[] = [];
    record(
      results,
      makeResult(SyncEntity.SALES_INVOICES, {
        recordsProcessed: 10,
        recordsCreated: 4,
        recordsUpdated: 1,
      }),
    );
    record(
      results,
      makeResult(SyncEntity.SALES_INVOICES, {
        recordsProcessed: 5,
        recordsUpdated: 6,
        recordsSkipped: 2,
      }),
    );
    expect(results).toHaveLength(1);
    expect(results[0].recordsProcessed).toBe(15);
    expect(results[0].recordsCreated).toBe(4);
    expect(results[0].recordsUpdated).toBe(7);
    expect(results[0].recordsSkipped).toBe(2);
  });

  it('should concatenate errors from merged results', () => {
    const results: SyncResultDto[] = [];
    record(results, makeResult(SyncEntity.PRODUCTS, { errors: ['a'] }));
    record(results, makeResult(SyncEntity.PRODUCTS, { errors: ['b'] }));
    expect(results[0].errors).toEqual(['a', 'b']);
  });

  it('should mark the entity failed when the merged result failed', () => {
    const results: SyncResultDto[] = [];
    record(results, makeResult(SyncEntity.PRODUCTS));
    record(
      results,
      makeResult(SyncEntity.PRODUCTS, { status: SyncStatus.FAILED }),
    );
    expect(results[0].status).toBe(SyncStatus.FAILED);
  });

  it('should not downgrade a failed entity back to completed', () => {
    const results: SyncResultDto[] = [];
    record(
      results,
      makeResult(SyncEntity.PRODUCTS, { status: SyncStatus.FAILED }),
    );
    record(
      results,
      makeResult(SyncEntity.PRODUCTS, { status: SyncStatus.COMPLETED }),
    );
    expect(results[0].status).toBe(SyncStatus.FAILED);
  });

  it('should keep distinct entities separate', () => {
    const results: SyncResultDto[] = [];
    record(results, makeResult(SyncEntity.CUSTOMERS));
    record(results, makeResult(SyncEntity.SUPPLIERS));
    record(results, makeResult(SyncEntity.PRODUCTS));
    expect(results.map((r) => r.entity)).toEqual([
      SyncEntity.CUSTOMERS,
      SyncEntity.SUPPLIERS,
      SyncEntity.PRODUCTS,
    ]);
  });
});

function makeJobDto(): ReviewJobStatusDto {
  return {
    id: 'revjob_1',
    action: ReviewJobAction.APPLY,
    status: SyncStatus.RUNNING,
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    total: 300,
    done: 45,
    applied: 40,
    skipped: 0,
    failed: 5,
    percentComplete: 15,
    currentEntity: 'customers',
    currentRecordKey: 'C-1',
    errors: ['products:P-9 boom'],
  };
}

describe('review job persistence mapping', () => {
  it('should round-trip a job through the row shape', () => {
    const job = makeJobDto();
    const row = {
      id: 3,
      created_at: new Date(),
      ...toReviewJobRow(job),
    } as PeachtreeReviewJob;
    expect(row.job_id).toBe('revjob_1');
    expect(row.status).toBe(SyncStatus.RUNNING);
    const back = fromReviewJobRow(row);
    expect(back).toEqual(job);
  });

  it('should map an empty row back to a usable job', () => {
    const row = {
      job_id: 'revjob_9',
      action: ReviewJobAction.SKIP,
      status: SyncStatus.COMPLETED,
      started_at: new Date('2026-01-02T00:00:00.000Z'),
      completed_at: null,
      total: 0,
      done: 0,
      applied: 0,
      skipped: 0,
      failed: 0,
      percent_complete: 100,
      current_entity: null,
      current_record_key: null,
      errors: [],
    } as unknown as PeachtreeReviewJob;
    const back = fromReviewJobRow(row);
    expect(back.completedAt).toBeUndefined();
    expect(back.currentEntity).toBeUndefined();
    expect(back.errors).toEqual([]);
  });
});

describe('PeachtreeSyncService.onModuleInit', () => {
  async function runInit(reviewJobRepo: unknown): Promise<unknown> {
    const proto = PeachtreeSyncService.prototype as unknown as {
      onModuleInit: () => Promise<void>;
    };
    const fakeLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    };
    await proto.onModuleInit.call({ reviewJobRepo, logger: fakeLogger });
    return fakeLogger;
  }

  it('should mark jobs left running as failed', async () => {
    const stale: {
      job_id: string;
      status: SyncStatus;
      errors: string[];
      completed_at?: Date;
    } = { job_id: 'revjob_old', status: SyncStatus.RUNNING, errors: ['x'] };
    const reviewJobRepo = {
      find: jest.fn().mockResolvedValue([stale]),
      save: jest.fn(),
    };
    await runInit(reviewJobRepo);
    expect(stale.status).toBe(SyncStatus.FAILED);
    expect(stale.completed_at).toBeInstanceOf(Date);
    expect(stale.errors).toHaveLength(2);
    expect(reviewJobRepo.save).toHaveBeenCalledWith(stale);
  });

  it('should do nothing when no job is left running', async () => {
    const reviewJobRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
    };
    await runInit(reviewJobRepo);
    expect(reviewJobRepo.save).not.toHaveBeenCalled();
  });

  it('should not throw when the table does not exist yet', async () => {
    const reviewJobRepo = {
      find: jest.fn().mockRejectedValue(new Error('relation does not exist')),
    };
    const fakeLogger = await runInit(reviewJobRepo);
    expect((fakeLogger as { warn: jest.Mock }).warn).toHaveBeenCalled();
  });
});
