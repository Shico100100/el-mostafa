import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { Job } from './entities/job.entity';
import { JobPhase } from './entities/job-phase.entity';
import { JobCost } from './entities/job-cost.entity';
import { Customer } from '../../sales/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobPhase, JobCost, Customer])],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
