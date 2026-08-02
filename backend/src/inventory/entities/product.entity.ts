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
import { Category } from './category.entity';
import { Warehouse } from './warehouse.entity';
import { Supplier } from '../../purchases/entities/supplier.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  selling_price: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'int', nullable: true })
  warehouse_id: number;

  @Column({ default: 'piece' })
  unit: string;

  @Column({ default: 'FINISHED' })
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight_grams: number;

  @Column({ nullable: true })
  image_path: string;

  @Column({ nullable: true })
  raw_material_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  reorder_point: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  reorder_quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0, nullable: true })
  avg_consumption_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  last_purchase_price: number;

  @Column({ type: 'date', nullable: true })
  last_purchase_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight_per_piece: number;

  @Column({ nullable: true })
  preferred_supplier_id: number;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'preferred_supplier_id' })
  preferred_supplier: Supplier;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: true, nullable: true })
  is_active: boolean;

  @DeleteDateColumn()
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
