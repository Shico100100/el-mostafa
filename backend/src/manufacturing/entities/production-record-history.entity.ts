import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyProduction } from './daily-production.entity';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('production_record_history')
export class ProductionRecordHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  production_id: number;

  @ManyToOne(() => DailyProduction)
  @JoinColumn({ name: 'production_id' })
  production: DailyProduction;

  @Column({ type: 'json' })
  old_values: Record<string, any>;

  @Column({ type: 'json' })
  new_values: Record<string, any>;

  @Column()
  change_type: string;

  @Column({ nullable: true })
  changed_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User;

  @CreateDateColumn()
  changed_at: Date;
}
