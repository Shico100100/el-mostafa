import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('salary_payments')
export class SalaryPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  month: string; // Format: YYYY-MM

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_salary: number;

  @Column({ type: 'int', default: 0 })
  attendance_days: number;

  @Column({ type: 'int', default: 0 })
  absent_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtime_pay: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  net_salary: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  payment_date: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
