import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PeachtreeSyncService } from './peachtree-sync.service';

@Injectable()
export class PeachtreeSyncScheduler {
  private readonly logger = new Logger(PeachtreeSyncScheduler.name);

  constructor(private syncService: PeachtreeSyncService) {}

  @Cron('0 2 * * *') // Daily at 2 AM
  async handleScheduledSync() {
    this.logger.log('Running scheduled Peachtree sync');
    try {
      await this.syncService.runSync('scheduled');
    } catch (error) {
      this.logger.error('Scheduled sync failed', error);
    }
  }
}
