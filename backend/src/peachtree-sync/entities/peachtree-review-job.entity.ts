import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/** Persisted snapshot of a bulk accept/ignore run. The live counters live
 * in memory while the job runs; this row is what survives a backend restart
 * so the UI can still show the last run instead of nothing. */
@Entity('peachtree_review_job')
export class PeachtreeReviewJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  job_id: string;

  @Column()
  action: string;

  @Column()
  status: string;

  @Column({ type: 'timestamp' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  done: number;

  @Column({ type: 'int', default: 0 })
  applied: number;

  @Column({ type: 'int', default: 0 })
  skipped: number;

  @Column({ type: 'int', default: 0 })
  failed: number;

  @Column({ type: 'int', default: 0 })
  percent_complete: number;

  @Column({ type: 'varchar', nullable: true })
  current_entity: string | null;

  @Column({ type: 'varchar', nullable: true })
  current_record_key: string | null;

  @Column({ type: 'jsonb', default: [] })
  errors: string[];

  @CreateDateColumn()
  created_at: Date;
}
