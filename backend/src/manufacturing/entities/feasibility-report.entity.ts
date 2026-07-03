import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('feasibility_reports')
export class FeasibilityReportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  items: { productId: number; quantity: number }[];

  @Column({ type: 'jsonb' })
  report: any;

  @CreateDateColumn()
  created_at: Date;
}
