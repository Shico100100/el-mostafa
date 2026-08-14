import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { JobCost } from './job-cost.entity';

@Entity('job_phases')
export class JobPhase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  job_id: number;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimated_cost: number;

  @OneToMany(() => JobCost, (cost) => cost.phase)
  costs: JobCost[];

  @CreateDateColumn()
  created_at: Date;
}
