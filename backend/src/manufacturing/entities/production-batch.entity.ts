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
import { Product } from '../../inventory/entities/product.entity';
import { BatchComponent } from './batch-component.entity';

export enum BatchStatus {
  PENDING = 'PENDING',
  RELEASED = 'RELEASED',
  ON_HOLD = 'ON_HOLD',
  RECALLED = 'RECALLED',
  EXPIRED = 'EXPIRED',
}

@Entity('production_batches')
export class ProductionBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  batch_number: string;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'date' })
  production_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ default: 'piece' })
  unit: string;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PENDING,
  })
  status: BatchStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  production_id: number;

  @Column({ nullable: true })
  created_by: number;

  @OneToMany(() => BatchComponent, (c) => c.batch, { cascade: true })
  components: BatchComponent[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
