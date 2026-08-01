import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('production_record_history')
export class ProductionRecordHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  production_id: number;

  @Column({ type: 'json', nullable: true })
  old_values: any;

  @Column({ type: 'json', nullable: true })
  new_values: any;

  @Column({ type: 'varchar', nullable: true })
  change_type: string | null;

  @Column({ type: 'int', nullable: true })
  changed_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  changed_at: Date | null;
}
