import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_payments')
export class CustomerPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ nullable: true })
  notes: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  order_id: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  method: string | null;

  @CreateDateColumn()
  created_at: Date;
}
