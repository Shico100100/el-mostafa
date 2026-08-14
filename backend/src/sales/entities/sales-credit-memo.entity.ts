import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { SalesCreditMemoItem } from './sales-credit-memo-item.entity';

@Entity('sales_credit_memos')
export class SalesCreditMemo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  customer_id: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  @Column({ default: 'PENDING' })
  status: string;

  @OneToMany(() => SalesCreditMemoItem, (item) => item.credit_memo)
  items: SalesCreditMemoItem[];

  @CreateDateColumn()
  created_at: Date;
}
