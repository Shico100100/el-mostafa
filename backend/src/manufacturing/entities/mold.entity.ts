import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';

export enum MoldStatus {
  GOOD = 'GOOD',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  BROKEN = 'BROKEN',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('molds')
export class Mold {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  product_weight: number;

  @Column({ type: 'int' })
  cavities: number;

  @Column({
    type: 'enum',
    enum: MoldStatus,
    default: MoldStatus.GOOD,
  })
  status: MoldStatus;

  @Column({ type: 'int', default: 0 })
  current_shots: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number; // Mold purchase price

  @Column({ type: 'int', default: 1000000 }) // Default 1M shots
  max_shots: number;

  @Column({ type: 'int', default: 0 })
  total_production_cycles: number;

  @Column({ type: 'varchar', default: 'new' })
  life_cycle_status: string; // new, good, warning, critical

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
