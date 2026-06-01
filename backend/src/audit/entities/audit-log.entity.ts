import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string; // e.g., 'UPDATE_PRODUCT'

  @Column()
  method: string; // POST, PUT, DELETE

  @Column()
  endpoint: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
