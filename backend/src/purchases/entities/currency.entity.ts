import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 3 })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  exchange_rate_to_egp: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
