import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum SyncLogAction {
  INSERTED = 'inserted',
  DIFFERENT = 'different',
  SKIPPED = 'skipped',
  MISSING = 'missing',
  UPDATED = 'updated',
  SKIPPED_REVIEW = 'skipped_review',
}

@Entity('peachtree_sync_log')
export class PeachtreeSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  run_id: string;

  @Column()
  triggered_by: string;

  @Column()
  entity: string;

  @Column()
  action: string;

  @Column()
  record_key: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}
