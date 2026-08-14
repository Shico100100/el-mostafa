import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { JobPhase } from '../../jobs/entities/job-phase.entity';
import { UserEntity as User } from '../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  job_id: number;

  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'int', nullable: true })
  phase_id: number;

  @ManyToOne(() => JobPhase, { nullable: true })
  @JoinColumn({ name: 'phase_id' })
  phase: JobPhase;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: true })
  is_billable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  billing_rate: number;

  @Column({ default: false })
  is_billed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
