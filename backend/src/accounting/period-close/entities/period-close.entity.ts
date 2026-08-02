import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('period_closes')
export class PeriodClose {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 7, unique: true })
  period: string;

  @Column({ default: 'OPEN' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  closed_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  closing_entries: any;

  @CreateDateColumn()
  created_at: Date;
}
