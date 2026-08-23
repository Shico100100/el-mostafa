import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobPhase } from './job-phase.entity';
import { JobCost } from './job-cost.entity';
import { Customer } from '../../../sales/entities/customer.entity';

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  customer_id: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimated_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actual_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimated_revenue: number;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.ACTIVE })
  status: JobStatus;

  @OneToMany(() => JobPhase, (phase) => phase.job)
  phases: JobPhase[];

  @OneToMany(() => JobCost, (cost) => cost.job)
  costs: JobCost[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
