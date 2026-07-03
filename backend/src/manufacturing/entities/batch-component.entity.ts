import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionBatch } from './production-batch.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('batch_components')
export class BatchComponent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  batch_id: number;

  @ManyToOne(() => ProductionBatch, (b) => b.components)
  @JoinColumn({ name: 'batch_id' })
  batch: ProductionBatch;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  supplier_batch_number: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity_used: number;

  @Column({ default: 'piece' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost_per_unit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_cost: number;

  @CreateDateColumn()
  created_at: Date;
}
