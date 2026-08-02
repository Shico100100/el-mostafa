import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('journal_entries')
@Index(['date', 'id'])
@Index(['account_id'])
@Index(['reversal_of'])
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true })
  reversal_of: number | null;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'int' })
  account_id: number;

  @ManyToOne(() => Account, (account) => account.entries)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @CreateDateColumn()
  created_at: Date;
}
