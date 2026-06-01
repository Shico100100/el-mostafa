import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplier_id: number;

  @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  amount_foreign: number;

  @Column({ length: 3, nullable: true })
  currency_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  exchange_rate: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
