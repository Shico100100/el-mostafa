import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { BOM } from './entities/bom.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';

@Injectable()
export class AssemblyService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  async getProductionRecipe(productId: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    // Find BOM
    const bom = await this.bomRepo.findOne({
      where: { product: { id: productId } },
      relations: ['items', 'items.product'],
    });

    if (!bom) {
      // Optional: return empty recipe or throw error if product SHOULD have BOM
      // For now, returning empty items to indicate no components defined.
      return {
        product: product.name,
        unit: product.unit,
        quantity,
        hasBom: false,
        items: [],
      };
    }

    const items: any[] = [];
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(quantity);

      // Get Current Stock
      // Note: Currently defaulting warehouse_id to 1 or summing all?
      // In a simple system, simple sum or finding stock for default warehouse.
      // Let's sum all stock for now or pick first valid.
      const stocks = await this.stockRepo.find({
        where: { product_id: item.product.id },
      });
      const totalStock = stocks.reduce((sum, s) => sum + Number(s.quantity), 0);

      items.push({
        productId: item.product.id,
        name: item.product.name,
        unit: item.product.unit,
        required: requiredQty,
        available: totalStock,
        status: totalStock >= requiredQty ? 'OK' : 'MISSING',
      });
    }

    return {
      product: product.name,
      unit: product.unit,
      quantity,
      hasBom: true,
      items,
    };
  }

  async recordProduction(data: {
    productId: number;
    quantity: number;
    date?: Date;
    notes?: string;
  }) {
    if (data.quantity <= 0)
      throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundException('المنتج غير موجود');
      }

      const bom = await manager.findOne(BOM, {
        where: { product: { id: data.productId } },
        relations: ['items', 'items.product'],
      });

      const productName = product.name;

      if (bom) {
        for (const item of bom.items) {
          const requiredQty = Number(item.quantity) * Number(data.quantity);
          const compProductId = item.product.id;

          const stocks = await manager.find(Stock, {
            where: { product_id: compProductId },
            order: { warehouse_id: 'ASC' },
          });

          const totalStock = stocks.reduce(
            (sum, s) => sum + Number(s.quantity),
            0,
          );

          if (totalStock < requiredQty) {
            throw new BadRequestException(
              `المكون ${item.product.name} غير كافٍ. المطلوب: ${requiredQty}, المتاح: ${totalStock}`,
            );
          }

          let remaining = requiredQty;
          for (const stock of stocks) {
            const toDeduct = Math.min(remaining, Number(stock.quantity));
            if (toDeduct > 0) {
              await manager.decrement(
                Stock,
                {
                  product_id: stock.product_id,
                  warehouse_id: stock.warehouse_id,
                },
                'quantity',
                toDeduct,
              );

              await manager.save(StockMovement, {
                product_id: compProductId,
                warehouse_id: stock.warehouse_id,
                type: MovementType.OUT,
                quantity: toDeduct,
                reference_type: 'PRODUCTION_CONSUMPTION',
                reference_id: data.productId,
                date: data.date || new Date(),
                notes: `Used in production of ${data.quantity} ${productName}`,
              });

              remaining -= toDeduct;
            }
          }
        }
      }

      let productStock = await manager.findOne(Stock, {
        where: { product_id: data.productId },
      });
      const whId = productStock?.warehouse_id || product?.warehouse_id || 1;
      if (!productStock) {
        productStock = manager.create(Stock, {
          product_id: data.productId,
          warehouse_id: whId,
          quantity: 0,
        });
        await manager.save(productStock);
      }

      await manager.increment(
        Stock,
        {
          product_id: productStock.product_id,
          warehouse_id: productStock.warehouse_id,
        },
        'quantity',
        data.quantity,
      );

      const productionLog = await manager.save(StockMovement, {
        product_id: data.productId,
        warehouse_id: productStock.warehouse_id,
        type: MovementType.IN,
        quantity: data.quantity,
        reference_type: 'PRODUCTION_OUTPUT',
        reference_id: data.productId,
        date: data.date || new Date(),
        notes: data.notes || 'Production Output',
      });

      return {
        success: true,
        message: 'Production recorded successfully',
        productionId: productionLog.id,
      };
    });
  }
}
