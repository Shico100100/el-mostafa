import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';

@Entity('boms')
export class BOM {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product; // The finished or semi-finished good

  @OneToMany(() => BOMItem, (item) => item.bom, { cascade: true })
  items: BOMItem[];

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('bom_items')
export class BOMItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bom_id: number;

  @ManyToOne(() => BOM, (bom) => bom.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product; // The component (Raw or Semi)

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number; // Quantity needed for 1 unit of parent
}
