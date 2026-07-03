import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('employee_profiles')
export class EmployeeProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  base_salary: number;

  @Column({ type: 'int', default: 8 })
  working_hours_per_day: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  overtime_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  deduction_rate: number; // Multiplier for missed days

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
