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
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('range_production_sessions')
export class RangeProductionSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  machine_id: number;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'machine_id' })
  machine: Machine;

  @Column({ type: 'int' })
  mold_id: number;

  @ManyToOne(() => Mold)
  @JoinColumn({ name: 'mold_id' })
  mold: Mold;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_production_kg: number;

  @Column({ default: 'distribute' })
  mode: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 8,
  })
  hours_worked: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn()
  created_at: Date;
}
