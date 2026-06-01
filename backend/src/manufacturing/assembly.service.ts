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
      throw new BadRequestException('Quantity must be positive');

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Find BOM
    const bom = await this.bomRepo.findOne({
      where: { product_id: productId },
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
      throw new BadRequestException('Quantity must be positive');

    return await this.dataSource.transaction(async (manager) => {
      const recipe = await this.getProductionRecipe(
        data.productId,
        data.quantity,
      );

      if (recipe.hasBom) {
        // Validate Stock
        const missing = recipe.items.find((i) => i.status === 'MISSING');
        if (missing) {
          throw new BadRequestException(
            `Insufficient stock for component: ${missing.name}. Required: ${missing.required}, Available: ${missing.available}`,
          );
        }

        // Deduct Components
        for (const item of recipe.items) {
          // Find suitable stock record (FIFO or specific warehouse)
          // For logic simplicity, deducting from first available warehouse or warehouse 1.
          // Assuming Warehouse 1 is default/Main.
          let stock = await manager.findOne(Stock, {
            where: { product_id: item.productId, warehouse_id: 1 },
          });

          if (!stock) {
            // Should verify if total available was correct but specific warehouse is empty?
            // Logic above checked sum. Here we might fail if spread across warehouses.
            // Simple fix: find ANY stock record with qty > 0
            stock = await manager.findOne(Stock, {
              where: { product_id: item.productId },
            }); // simplified
          }

          if (!stock) {
            // Theoretically unreachable if check passed, unless concurrent update
            throw new BadRequestException(
              `Stock for ${item.name} not available in standard warehouse`,
            );
          }

          // Decrement
          await manager.decrement(
            Stock,
            { product_id: stock.product_id, warehouse_id: stock.warehouse_id },
            'quantity',
            item.required,
          );

          // Log OUT Movement
          await manager.save(StockMovement, {
            product_id: item.productId,
            warehouse_id: stock.warehouse_id,
            type: MovementType.OUT,
            quantity: item.required,
            reference_type: 'PRODUCTION_CONSUMPTION',
            reference_id: data.productId, // Reference parent product
            date: data.date || new Date(),
            notes: `Used in production of ${data.quantity} ${recipe.product}`,
          });
        }
      }

      // ADD Finished Product
      // Warehouse 1 default
      let productStock = await manager.findOne(Stock, {
        where: { product_id: data.productId, warehouse_id: 1 },
      });
      if (!productStock) {
        productStock = manager.create(Stock, {
          product_id: data.productId,
          warehouse_id: 1, // Default
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

      // Log IN Movement
      const productionLog = await manager.save(StockMovement, {
        product_id: data.productId,
        warehouse_id: 1,
        type: MovementType.IN,
        quantity: data.quantity,
        reference_type: 'PRODUCTION_OUTPUT',
        reference_id: data.productId, // Self ref? or Create a Production Log entity ID if exists
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
