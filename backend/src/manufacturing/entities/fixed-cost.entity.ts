import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FixedCostCategory {
  RENT = 'RENT',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  WAGES = 'WAGES',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

@Entity('fixed_costs')
export class FixedCost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  month: string; // Format: YYYY-MM

  @Column({
    type: 'enum',
    enum: FixedCostCategory,
    default: FixedCostCategory.OTHER,
  })
  category: FixedCostCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
