import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('serial_numbers')
export class SerialNumber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ unique: true })
  serial_number: string;

  @Column({ nullable: true })
  batch_number: string;

  @Column({ default: 'AVAILABLE' })
  status: string;

  @Column({ type: 'int', nullable: true })
  warehouse_id: number;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ type: 'int', nullable: true })
  reference_id: number;

  @CreateDateColumn()
  created_at: Date;
}
