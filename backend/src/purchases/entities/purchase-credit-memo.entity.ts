import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { PurchaseCreditMemoItem } from './purchase-credit-memo-item.entity';

@Entity('purchase_credit_memos')
export class PurchaseCreditMemo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  supplier_id: number;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  @Column({ default: 'PENDING' })
  status: string;

  @OneToMany(() => PurchaseCreditMemoItem, (item) => item.credit_memo)
  items: PurchaseCreditMemoItem[];

  @CreateDateColumn()
  created_at: Date;
}
