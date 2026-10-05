import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PeachtreeSyncService } from './peachtree-sync.service';
import { PeachtreeReviewService } from './peachtree-review.service';

const RETENTION_DAYS = 90;

@Injectable()
export class PeachtreeSyncScheduler {
  private readonly logger = new Logger(PeachtreeSyncScheduler.name);

  constructor(
    private syncService: PeachtreeSyncService,
    private reviewService: PeachtreeReviewService,
  ) {}

  @Cron('0 2 * * *') // Daily at 2 AM
  async handleScheduledSync() {
    this.logger.log('Running scheduled Peachtree sync');
    try {
      await this.syncService.runSync('scheduled');
    } catch (error) {
      this.logger.error('Scheduled sync failed', error);
    }
  }

  @Cron('0 3 * * 0') // Sundays at 3 AM
  async handleReviewRetention() {
    this.logger.log(
      `Pruning decided reviews and logs older than ${RETENTION_DAYS} days`,
    );
    try {
      const reviews =
        await this.reviewService.pruneDecidedReviews(RETENTION_DAYS);
      const logs = await this.reviewService.pruneLogs(RETENTION_DAYS);
      this.logger.log(`Pruned ${reviews} reviews and ${logs} logs`);
    } catch (error) {
      this.logger.error('Review retention prune failed', error);
    }
  }
}
