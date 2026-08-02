import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeBillingService } from './time-billing.service';
import { TimeBillingController } from './time-billing.controller';
import { TimeEntry } from './entities/time-entry.entity';
import { Job } from '../jobs/entities/job.entity';
import { JobPhase } from '../jobs/entities/job-phase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, Job, JobPhase])],
  controllers: [TimeBillingController],
  providers: [TimeBillingService],
  exports: [TimeBillingService],
})
export class TimeBillingModule {}
