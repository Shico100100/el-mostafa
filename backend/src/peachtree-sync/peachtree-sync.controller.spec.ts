import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PeachtreeSyncController } from './peachtree-sync.controller';
import { PeachtreeSyncService } from './peachtree-sync.service';
import { SyncEntity } from './dto/sync-status.dto';

describe('PeachtreeSyncController entity filters', () => {
  let controller: PeachtreeSyncController;
  let syncService: { getPendingSummary: jest.Mock; startReviewJob: jest.Mock };

  beforeEach(async () => {
    syncService = { getPendingSummary: jest.fn(), startReviewJob: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeachtreeSyncController],
      providers: [{ provide: PeachtreeSyncService, useValue: syncService }],
    }).compile();
    controller = module.get<PeachtreeSyncController>(PeachtreeSyncController);
  });

  it('should pass valid entity filters through to the service', async () => {
    syncService.getPendingSummary.mockResolvedValue({ total: 1, byEntity: [] });
    await controller.getPendingSummary({ entity: 'customers' });
    expect(syncService.getPendingSummary).toHaveBeenCalledWith([
      SyncEntity.CUSTOMERS,
    ]);
  });

  it('should pass undefined when no filter is given', async () => {
    syncService.getPendingSummary.mockResolvedValue({ total: 0, byEntity: [] });
    await controller.getPendingSummary({});
    expect(syncService.getPendingSummary).toHaveBeenCalledWith(undefined);
  });

  it('should reject an unknown entity on the summary route instead of widening to all', async () => {
    await expect(
      controller.getPendingSummary({ entity: 'bogus' }),
    ).rejects.toThrow(BadRequestException);
    expect(syncService.getPendingSummary).not.toHaveBeenCalled();
  });

  it('should reject an unknown entity on apply-all instead of applying to everything', async () => {
    await expect(controller.applyAll({ entities: ['bogus'] })).rejects.toThrow(
      BadRequestException,
    );
    expect(syncService.startReviewJob).not.toHaveBeenCalled();
  });

  it('should reject an unknown entity on skip-all', async () => {
    await expect(controller.skipAll({ entities: ['nope'] })).rejects.toThrow(
      BadRequestException,
    );
    expect(syncService.startReviewJob).not.toHaveBeenCalled();
  });
});
