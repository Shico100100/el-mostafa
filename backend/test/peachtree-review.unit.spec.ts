import { PeachtreeReviewService } from '../src/peachtree-sync/peachtree-review.service';
import {
  PeachtreeSyncReview,
  ReviewStatus,
} from '../src/peachtree-sync/entities/peachtree-sync-review.entity';
import {
  PeachtreeSyncLog,
  SyncLogAction,
} from '../src/peachtree-sync/entities/peachtree-sync-log.entity';
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
