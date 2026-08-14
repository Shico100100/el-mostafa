import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { JobPhase } from './job-phase.entity';

@Entity('job_costs')
export class JobCost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  job_id: number;

  @ManyToOne(() => Job, (job) => job.costs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'int', nullable: true })
  phase_id: number;

  @ManyToOne(() => JobPhase, (phase) => phase.costs, { nullable: true })
  @JoinColumn({ name: 'phase_id' })
  phase: JobPhase;

  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ nullable: true })
  reference: string;

  @CreateDateColumn()
  created_at: Date;
}
