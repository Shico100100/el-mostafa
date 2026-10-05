import { SyncEntity, SyncResultDto, SyncStatus } from './dto/sync-status.dto';
import { PeachtreeSyncService } from './peachtree-sync.service';

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
