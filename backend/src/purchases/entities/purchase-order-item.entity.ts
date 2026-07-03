import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_id: number;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Multi-Currency
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  foreign_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  foreign_total: number;

  // Landed Cost
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  landed_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  weight_kg: number;
}
