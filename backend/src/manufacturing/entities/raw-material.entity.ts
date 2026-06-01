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
import { Supplier } from '../../purchases/entities/supplier.entity';

@Entity('raw_materials')
export class RawMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  preferred_supplier_id: number;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'preferred_supplier_id' })
  preferred_supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorder_point: number; // Minimum stock level before reorder

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorder_quantity: number; // Suggested quantity to order

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  avg_consumption_rate: number; // Average daily consumption

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  last_purchase_price: number;

  @Column({ type: 'date', nullable: true })
  last_purchase_date: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany('RawMaterialConsumption', 'raw_material')
  consumptions: any[];

  @OneToMany('SupplierMaterial', 'raw_material')
  supplier_materials: any[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
