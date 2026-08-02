import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Machine } from './machine.entity';
import { Mold } from './mold.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('daily_production')
export class DailyProduction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ type: 'int' })
  machine_id: number;

  @ManyToOne(() => Mold)
  @JoinColumn({ name: 'mold_id' })
  mold: Mold;

  @Column({ type: 'int' })
  mold_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', nullable: true })
  product_id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_production_kg: number;

  @Column({ type: 'int', nullable: true })
  pieces_produced: number;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 8,
  })
  hours_worked: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  overhead_cost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  session_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
