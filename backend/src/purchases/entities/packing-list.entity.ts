import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('packing_lists')
export class PackingList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_id: number;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  // Carton dimensions in cm
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  carton_length_cm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  carton_width_cm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  carton_height_cm: number;

  // Carton count
  @Column({ type: 'int' })
  cartons_count: number;

  // Calculated CBM
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  total_cbm: number;

  // Actual weights shipped by supplier
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actual_net_weight_kg: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actual_gross_weight_kg: number | null;

  // Deviation alert
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  deviation_threshold_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight_deviation_percent: number | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
