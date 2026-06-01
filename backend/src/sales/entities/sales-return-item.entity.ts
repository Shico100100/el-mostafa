import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesReturn } from './sales-return.entity';
import { Product } from '../../inventory/entities/product.entity';

@Entity('sales_return_items')
export class SalesReturnItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  return_id: number;

  @ManyToOne(() => SalesReturn, (ret) => ret.items)
  @JoinColumn({ name: 'return_id' })
  return: SalesReturn;

  @Column()
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
