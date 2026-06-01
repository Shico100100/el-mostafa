import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Supplier } from '../../purchases/entities/supplier.entity';
import { RawMaterial } from './raw-material.entity';

@Entity('supplier_materials')
export class SupplierMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplier_id: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column()
  raw_material_id: number;

  @ManyToOne(() => RawMaterial, (rm) => rm.supplier_materials)
  @JoinColumn({ name: 'raw_material_id' })
  raw_material: RawMaterial;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  lead_time_days: number; // Delivery time in days

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_order_quantity: number;

  @Column({ default: false })
  is_preferred: boolean;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
