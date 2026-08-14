import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { FixedAsset } from './fixed-asset.entity';

@Entity('depreciation_entries')
export class DepreciationEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  asset_id: number;

  @ManyToOne(() => FixedAsset, (fa) => fa.depreciation_entries)
  @JoinColumn({ name: 'asset_id' })
  asset: FixedAsset;

  @Column({ length: 7 }) // YYYY-MM
  period: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  accumulated_after: number;

  @Column({ nullable: true, type: 'int' })
  journal_entry_id: number;

  @CreateDateColumn()
  created_at: Date;
}
