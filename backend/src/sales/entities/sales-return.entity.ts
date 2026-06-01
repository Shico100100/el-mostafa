import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { SalesOrder } from './sales-order.entity';
import { SalesReturnItem } from './sales-return-item.entity';

@Entity('sales_returns')
export class SalesReturn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ nullable: true })
  order_id: number;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'date' })
  return_date: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @OneToMany(() => SalesReturnItem, (item) => item.return)
  items: SalesReturnItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
