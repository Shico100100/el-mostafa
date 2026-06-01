import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('containers')
export class Container {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  length_cm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  width_cm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  height_cm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  max_weight_kg: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  max_cbm: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
