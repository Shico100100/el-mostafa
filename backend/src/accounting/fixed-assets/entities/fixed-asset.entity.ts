import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DepreciationEntry } from './depreciation-entry.entity';

export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DECLINING_BALANCE = 'DECLINING_BALANCE',
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  DISPOSED = 'DISPOSED',
}

@Entity('fixed_assets')
export class FixedAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  asset_code: string;

  @Column({ nullable: true })
  category: string; // BUILDING, VEHICLE, EQUIPMENT, FURNITURE, etc.

  @Column({ type: 'date' })
  purchase_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  purchase_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  salvage_value: number;

  @Column({ type: 'int' })
  useful_life_years: number;

  @Column({ type: 'enum', enum: DepreciationMethod, default: DepreciationMethod.STRAIGHT_LINE })
  depreciation_method: DepreciationMethod;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  accumulated_depreciation: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  book_value: number;

  @Column({ type: 'date', nullable: true })
  disposal_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  disposal_amount: number;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status: AssetStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany(() => DepreciationEntry, (entry) => entry.asset)
  depreciation_entries: DepreciationEntry[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
