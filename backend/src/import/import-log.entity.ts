import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('import_logs')
export class ImportLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // 'products', 'customers', 'suppliers'

  @Column()
  filename: string;

  @Column({ default: 0 })
  recordsImported: number;

  @Column({ default: 0 })
  recordsSkipped: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  importedAt: Date;
}
