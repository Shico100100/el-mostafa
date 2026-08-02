import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BankAccount } from './bank-account.entity';

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  bank_account_id: number;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'bank_account_id' })
  bank_account: BankAccount;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  check_number: string;

  @Column({ default: false })
  is_reconciled: boolean;

  @Column({ nullable: true, type: 'int' })
  journal_entry_id: number;

  @Column({ nullable: true, type: 'int' })
  reconciliation_id: number;

  @CreateDateColumn()
  created_at: Date;
}
