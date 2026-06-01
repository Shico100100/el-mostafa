import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionBatch } from './production-batch.entity';
import { RawMaterial } from './raw-material.entity';
import { Accessory } from './accessory.entity';

@Entity('batch_components')
export class BatchComponent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batch_id: number;

  @ManyToOne(() => ProductionBatch, (b) => b.components)
  @JoinColumn({ name: 'batch_id' })
  batch: ProductionBatch;

  @Column({ nullable: true })
  raw_material_id: number;

  @ManyToOne(() => RawMaterial, { nullable: true })
  @JoinColumn({ name: 'raw_material_id' })
  raw_material: RawMaterial;

  @Column({ nullable: true })
  accessory_id: number;

  @ManyToOne(() => Accessory, { nullable: true })
  @JoinColumn({ name: 'accessory_id' })
  accessory: Accessory;

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
