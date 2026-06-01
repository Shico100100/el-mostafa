import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Supplier } from './supplier.entity';

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplier_id: number;

  @Column({ nullable: true })
  invoice_number: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status: PurchaseOrderStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'date', nullable: true })
  order_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.order)
  items: PurchaseOrderItem[];

  // Multi-Currency Fields
  @Column({ length: 3, nullable: true })
  currency_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  exchange_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount_foreign: number;

  // Landed Cost Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freight_cost: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  customs_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commission_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_landed_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_weight_kg: number;
}
