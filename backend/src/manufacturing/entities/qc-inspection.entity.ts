import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyProduction } from './daily-production.entity';
import { Product } from '../../inventory/entities/product.entity';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('qc_inspections')
export class QCInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  production_id: number;

  @ManyToOne(() => DailyProduction)
  @JoinColumn({ name: 'production_id' })
  production: DailyProduction;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  inspector_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column({ default: 'PENDING' }) // PENDING, PASS, FAIL
  status: string;

  @Column({ type: 'int', default: 0 })
  defects_count: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
