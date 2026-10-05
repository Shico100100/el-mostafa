import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PeachtreeReviewService } from './peachtree-review.service';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import {
  PeachtreeSyncLog,
  SyncLogAction,
} from './entities/peachtree-sync-log.entity';
import { SyncEntity } from './dto/sync-status.dto';

describe('PeachtreeReviewService.hasAcceptedMissing', () => {
  let service: PeachtreeReviewService;
  let reviewRepo: { count: jest.Mock };

  beforeEach(async () => {
    reviewRepo = { count: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeachtreeReviewService,
        {
          provide: getRepositoryToken(PeachtreeSyncReview),
          useValue: reviewRepo,
        },
        { provide: getRepositoryToken(PeachtreeSyncLog), useValue: {} },
      ],
    }).compile();
    service = module.get<PeachtreeReviewService>(PeachtreeReviewService);
  });

  it('should return true when an accepted missing review exists', async () => {
    reviewRepo.count.mockResolvedValue(2);
    const result = await service.hasAcceptedMissing(
      SyncEntity.SALES_INVOICES,
      '[PQ-1_2_3] x',
    );
    expect(result).toBe(true);
    expect(reviewRepo.count).toHaveBeenCalledWith({
      where: {
        entity: SyncEntity.SALES_INVOICES,
        record_key: '[PQ-1_2_3] x',
        change_type: 'missing',
        status: 'accepted',
      },
    });
  });

  it('should return false when no accepted missing review exists', async () => {
    reviewRepo.count.mockResolvedValue(0);
    const result = await service.hasAcceptedMissing(
      SyncEntity.PRODUCTS,
      'SKU-1',
    );
    expect(result).toBe(false);
  });
});

describe('PeachtreeReviewService.prune', () => {
  let service: PeachtreeReviewService;
  let reviewRepo: { delete: jest.Mock };
  let logRepo: { delete: jest.Mock };

  beforeEach(async () => {
    reviewRepo = { delete: jest.fn().mockResolvedValue({ affected: 7 }) };
    logRepo = { delete: jest.fn().mockResolvedValue({ affected: 11 }) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeachtreeReviewService,
        {
          provide: getRepositoryToken(PeachtreeSyncReview),
          useValue: reviewRepo,
        },
        { provide: getRepositoryToken(PeachtreeSyncLog), useValue: logRepo },
      ],
    }).compile();
    service = module.get<PeachtreeReviewService>(PeachtreeReviewService);
  });

  it('should delete only decided reviews older than the cutoff', async () => {
    const removed = await service.pruneDecidedReviews(90);
    expect(removed).toBe(7);
    const where = reviewRepo.delete.mock.calls[0][0];
    expect(where.status.type).toBe('in');
    expect(where.status.value).toEqual(
      expect.arrayContaining(['accepted', 'skipped']),
    );
    expect(where.decided_at.type).toBe('lessThan');
    expect(where.decided_at.value instanceof Date).toBe(true);
  });

  it('should delete logs older than the cutoff', async () => {
    const removed = await service.pruneLogs(90);
    expect(removed).toBe(11);
    const where = logRepo.delete.mock.calls[0][0];
    expect(where.created_at.type).toBe('lessThan');
    expect(where.created_at.value instanceof Date).toBe(true);
  });
});

describe('PeachtreeReviewService.logMany', () => {
  it('should insert all entries in a single query', async () => {
    const insert = jest.fn().mockResolvedValue({ identifiers: [] });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeachtreeReviewService,
        { provide: getRepositoryToken(PeachtreeSyncReview), useValue: {} },
        { provide: getRepositoryToken(PeachtreeSyncLog), useValue: { insert } },
      ],
    }).compile();
    const service = module.get<PeachtreeReviewService>(PeachtreeReviewService);
    await service.logMany([
      {
        runId: 'r1',
        triggeredBy: 'apply',
        entity: SyncEntity.PRODUCTS,
        action: SyncLogAction.UPDATED,
        recordKey: 'A',
      },
      {
        runId: 'r1',
        triggeredBy: 'apply',
        entity: SyncEntity.PRODUCTS,
        action: SyncLogAction.UPDATED,
        recordKey: 'B',
      },
    ]);
    expect(insert).toHaveBeenCalledTimes(1);
    const rows = insert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ run_id: 'r1', record_key: 'A' });
    expect(rows[1]).toMatchObject({ run_id: 'r1', record_key: 'B' });
  });

  it('should skip the query when there is nothing to log', async () => {
    const insert = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeachtreeReviewService,
        { provide: getRepositoryToken(PeachtreeSyncReview), useValue: {} },
        { provide: getRepositoryToken(PeachtreeSyncLog), useValue: { insert } },
      ],
    }).compile();
    const service = module.get<PeachtreeReviewService>(PeachtreeReviewService);
    await service.logMany([]);
    expect(insert).not.toHaveBeenCalled();
  });
});
