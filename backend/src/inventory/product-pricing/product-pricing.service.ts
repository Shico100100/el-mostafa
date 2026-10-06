import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';
import { BOM } from '../../manufacturing/entities/bom.entity';

@Injectable()
export class ProductPricingService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    private dataSource: DataSource,
  ) {}

  async recalculateProductStock(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    const movements = await this.movementRepo.find({
      where: { product: { id } },
    });
    let calculatedQuantity = 0;
    for (const mov of movements) {
      if (mov.type === MovementType.IN)
        calculatedQuantity += Number(mov.quantity);
      else if (mov.type === MovementType.OUT)
        calculatedQuantity -= Number(mov.quantity);
      else if (mov.type === MovementType.ADJUST)
        calculatedQuantity = Number(mov.quantity);
    }
    let stock = await this.stockRepo.findOne({ where: { product_id: id } });
    if (!stock) {
      const whId = product.warehouse_id || 1;
      stock = this.stockRepo.create({
        product_id: id,
        warehouse_id: whId,
        quantity: 0,
      });
    }
    stock.quantity = calculatedQuantity;
    await this.stockRepo.save(stock);
    return {
      product_id: id,
      calculated_stock: calculatedQuantity,
      movement_count: movements.length,
    };
  }

  async autoPriceProduct(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    const bom = await this.bomRepo.findOne({
      where: { product_id: productId },
      relations: ['items', 'items.product'],
    });
    if (!bom) throw new BadRequestException('لا توجد قائمة مكونات لهذا المنتج');
    let totalCost = 0;
    for (const item of bom.items) {
      totalCost +=
        Number(item.quantity) * (Number(item.product.cost_price) || 0);
    }
    product.cost_price = totalCost as any;
    await this.productRepo.save(product);
    return { total_cost: totalCost };
  }
}
