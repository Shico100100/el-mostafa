import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BOM } from './bom.entity';
import { User } from '../../users/user.entity';

@Entity('assembly_orders')
export class AssemblyOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  bom_id: number;

  @ManyToOne(() => BOM)
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column({ type: 'int' })
  quantity_produced: number;

  @Column({ nullable: true })
  worker_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'worker_id' })
  worker: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_cost: number;

  @Column({ default: 'COMPLETED' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
