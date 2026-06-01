import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

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

  @Column({ nullable: true })
  category_id: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ default: 'piece' })
  unit: string;

  @Column({ default: 'FINISHED' }) // RAW, SEMI, FINISHED
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
