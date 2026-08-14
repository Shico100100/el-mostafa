import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseCreditMemo } from './purchase-credit-memo.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('purchase_credit_memo_items')
export class PurchaseCreditMemoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  credit_memo_id: number;

  @ManyToOne(() => PurchaseCreditMemo, (cm) => cm.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credit_memo_id' })
  credit_memo: PurchaseCreditMemo;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;
}
