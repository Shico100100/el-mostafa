import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  path: string;

  @Column()
  mimetype: string;

  @Column()
  related_type: string; // 'SalesOrder', 'PurchaseOrder', 'JournalEntry'

  @Column()
  related_id: number;

  @CreateDateColumn()
  created_at: Date;
}
