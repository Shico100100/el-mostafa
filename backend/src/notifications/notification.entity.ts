import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  userId: number; // If null, it's a system-wide notification (e.g. for all admins)

  @Column({ nullable: true })
  actionType: string; // 'delete_movement', 'delete_order', etc.

  @Column({ type: 'json', nullable: true })
  actionData: any; // { movementId: 123, productId: 456 }

  @CreateDateColumn()
  createdAt: Date;
}
