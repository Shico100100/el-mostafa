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
import { RawMaterial } from './raw-material.entity';

@Entity('daily_production')
export class DailyProduction {
  @PrimaryGeneratedColumn()
  id: number;

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
  raw_material_id: number;

  @ManyToOne(() => RawMaterial)
  @JoinColumn({ name: 'raw_material_id' })
  raw_material: RawMaterial;

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
  overhead_cost: number; // Cost per piece (raw material + fixed costs)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'PENDING' }) // PENDING, QC_PASS, QC_FAIL
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
