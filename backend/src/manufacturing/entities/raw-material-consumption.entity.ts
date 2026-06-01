import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RawMaterial } from './raw-material.entity';
import { AssemblyOrder } from './assembly-order.entity';
import { DailyProduction } from './daily-production.entity';

@Entity('raw_material_consumptions')
export class RawMaterialConsumption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  raw_material_id: number;

  @Column({ nullable: true })
  batch_number: string;

  @ManyToOne(() => RawMaterial, (rm) => rm.consumptions)
  @JoinColumn({ name: 'raw_material_id' })
  raw_material: RawMaterial;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ nullable: true })
  assembly_order_id: number;

  @ManyToOne(() => AssemblyOrder, { nullable: true })
  @JoinColumn({ name: 'assembly_order_id' })
  assembly_order: AssemblyOrder;

  @Column({ nullable: true })
  production_id: number;

  @ManyToOne(() => DailyProduction, { nullable: true })
  @JoinColumn({ name: 'production_id' })
  production: DailyProduction;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost_per_unit: number; // Cost at time of consumption

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_cost: number; // quantity * cost_per_unit

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  consumed_at: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
