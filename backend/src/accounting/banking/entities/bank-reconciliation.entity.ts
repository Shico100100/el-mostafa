import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('bank_reconciliations')
export class BankReconciliation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  bank_account_id: number;

  @Column({ type: 'date' })
  statement_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  statement_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  reconciled_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  difference: number;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  reconciled_by: string;

  @CreateDateColumn()
  created_at: Date;
}
