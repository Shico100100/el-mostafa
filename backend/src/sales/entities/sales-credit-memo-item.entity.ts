import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesCreditMemo } from './sales-credit-memo.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('sales_credit_memo_items')
export class SalesCreditMemoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  credit_memo_id: number;

  @ManyToOne(() => SalesCreditMemo, (cm) => cm.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_memo_id' })
  credit_memo: SalesCreditMemo;

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
