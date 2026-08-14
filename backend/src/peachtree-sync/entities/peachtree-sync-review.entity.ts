import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum ReviewStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  SKIPPED = 'skipped',
}

@Entity('peachtree_sync_review')
export class PeachtreeSyncReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entity: string;

  @Column()
  record_key: string;

  @Column()
  change_type: string;

  @Column({ type: 'int', nullable: true })
  db_record_id: number | null;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @Column({ default: ReviewStatus.PENDING })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  decided_at: Date | null;
}