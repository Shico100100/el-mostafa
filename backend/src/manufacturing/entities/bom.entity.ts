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

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => BOMItem, (item) => item.bom, { cascade: true })
  items: BOMItem[];

  @Column({ type: 'int', default: 1 })
  pcs_per_carton: number;

  @Column({ type: 'int', default: 1 })
  pcs_per_box: number;

  @Column({ type: 'int' })
  carton_product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'carton_product_id' })
  carton_product: Product;

  @Column({ type: 'int' })
  box_product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'box_product_id' })
  box_product: Product;

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

  @Column({ type: 'int' })
  bom_id: number;

  @ManyToOne(() => BOM, (bom) => bom.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product; // The component (Raw or Semi)

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number; // Quantity needed for 1 unit of parent
}
