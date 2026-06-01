import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';

export enum ManufacturingOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ManufacturingOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('manufacturing_orders')
export class ManufacturingOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sales_order_id: number;

  @Column({ nullable: true })
  sales_order_item_id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity_required: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity_produced: number;

  @Column({
    type: 'enum',
    enum: ManufacturingOrderStatus,
    default: ManufacturingOrderStatus.PENDING,
  })
  status: ManufacturingOrderStatus;

  @Column({
    type: 'enum',
    enum: ManufacturingOrderPriority,
    default: ManufacturingOrderPriority.MEDIUM,
  })
  priority: ManufacturingOrderPriority;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, type: 'timestamp' })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
