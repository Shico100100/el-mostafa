import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Machine } from './machine.entity';
import { Mold } from './mold.entity';
import { Product } from '../../inventory/entities/product.entity';

export enum ScheduleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Shift {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

@Entity('production_schedules')
export class ProductionSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  planned_date: Date;

  @Column({ type: 'enum', enum: Shift })
  shift: Shift;

  @Column()
  machine_id: number;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column()
  mold_id: number;

  @ManyToOne(() => Mold)
  @JoinColumn({ name: 'mold_id' })
  mold: Mold;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  target_quantity: number;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.PENDING,
  })
  status: ScheduleStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
