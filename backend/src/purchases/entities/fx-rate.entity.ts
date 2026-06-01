import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Currency } from './currency.entity';

@Entity('fx_rates')
export class FxRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  currency_id: number;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rate_to_egp: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount_paid: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'date' })
  rate_date: Date;

  @CreateDateColumn()
  created_at: Date;
}
