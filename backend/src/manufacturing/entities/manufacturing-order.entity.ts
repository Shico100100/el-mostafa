import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';

@Entity('manufacturing_orders')
export class ManufacturingOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  sales_order_id: number;

  @Column({ type: 'int', nullable: true })
  sales_order_item_id: number;

  @Index()
  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity_required: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity_produced: number;

  @Index()
  @Column({ default: 'PENDING' })
  status: string;

  @Column({ default: 'MEDIUM' })
  priority: string;

  @Index()
  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
