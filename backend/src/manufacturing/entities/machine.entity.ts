import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MachineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN',
}

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column({
    type: 'enum',
    enum: MachineStatus,
    default: MachineStatus.ACTIVE,
  })
  status: MachineStatus;

  @Column({ type: 'date', nullable: true })
  last_maintenance: Date;

  @Column({ type: 'date', nullable: true })
  next_maintenance: Date;

  @Column({ type: 'int', default: 30 })
  maintenance_interval_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  power_consumption: number; // kWh

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number; // Machine purchase price

  @Column({ type: 'int', default: 5 })
  useful_life_years: number; // Years to depreciate over

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
