import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { BackupSchedulerService } from './backup-scheduler.service';

@Module({
  controllers: [SystemController],
  providers: [SystemService, BackupSchedulerService],
})
export class SystemModule {}
