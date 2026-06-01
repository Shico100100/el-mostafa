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
import { Supplier } from './supplier.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseReturnItem } from './purchase-return-item.entity';

@Entity('purchase_returns')
export class PurchaseReturn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplier_id: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ nullable: true })
  order_id: number;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'date' })
  return_date: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @OneToMany(() => PurchaseReturnItem, (item) => item.return)
  items: PurchaseReturnItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
