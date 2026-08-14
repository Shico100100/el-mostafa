import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { Account } from '../../entities/account.entity';

@Entity('budget_lines')
export class BudgetLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  budget_id: number;

  @ManyToOne(() => Budget)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ nullable: true })
  account_id: number;

  @ManyToOne(() => Account, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgeted_amount: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
