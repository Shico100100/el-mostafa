import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';
import { Supplier } from '../../purchases/entities/supplier.entity';

@Entity('accessories')
export class Accessory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  preferred_supplier_id: number;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'preferred_supplier_id' })
  preferred_supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorder_point: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorder_quantity: number;

  @Column({ nullable: true })
  image_path: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight_per_piece: number; // Weight in grams

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  last_purchase_price: number;

  @Column({ type: 'date', nullable: true })
  last_purchase_date: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
