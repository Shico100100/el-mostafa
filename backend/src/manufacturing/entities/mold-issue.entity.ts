import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Mold } from './mold.entity';

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

@Entity('mold_issues')
export class MoldIssue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  mold_id: number;

  @ManyToOne(() => Mold)
  @JoinColumn({ name: 'mold_id' })
  mold: Mold;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.OPEN,
  })
  status: IssueStatus;

  @Column({ nullable: true, type: 'text' })
  resolution: string;

  @Column({ nullable: true, type: 'text' })
  image_path: string;

  @CreateDateColumn()
  created_at: Date;
}
