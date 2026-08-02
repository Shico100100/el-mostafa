import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';
import { DailyProduction } from './daily-production.entity';

@Entity('raw_material_consumptions')
export class RawMaterialConsumption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  product_id: number;

  @Column({ nullable: true })
  batch_number: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ nullable: true })
  production_id: number;

  @ManyToOne(() => DailyProduction, { nullable: true })
  @JoinColumn({ name: 'production_id' })
  production: DailyProduction;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost_per_unit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_cost: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  consumed_at: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
