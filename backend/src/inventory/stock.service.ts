import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
  ) {}

  async getDefaultWarehouseId(): Promise<number> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (warehouse) return warehouse.id;
    const created = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'المستودع الرئيسي', is_active: true }),
    );
    return created.id;
  }

  async addStockMovement(
    data: {
      product_id: number;
      warehouse_id: number;
      type: MovementType;
      quantity: number;
      notes?: string;
      date?: Date;
    },
    manager?: EntityManager,
    skipStockCheck?: boolean,
  ) {
    const entityManager = manager || this.movementRepo.manager;
    const movement = entityManager.create(StockMovement, {
      ...data,
      date: data.date || new Date(),
    });
    await entityManager.save(StockMovement, movement);

    let stock = await entityManager.findOne(Stock, {
      where: { product_id: data.product_id, warehouse_id: data.warehouse_id },
    });
    if (!stock) {
      stock = entityManager.create(Stock, {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        quantity: 0,
      });
    }
    if (data.type === MovementType.IN) {
      stock.quantity = Number(stock.quantity) + Number(data.quantity);
    } else if (data.type === MovementType.OUT) {
      const currentQty = Number(stock.quantity);
      const deductQty = Number(data.quantity);
      if (!skipStockCheck && deductQty > currentQty) {
        throw new BadRequestException(
          `المخزون غير كافٍ: المتاح ${currentQty} والمطلوب ${deductQty}`,
        );
      }
      stock.quantity = currentQty - deductQty;
    } else if (data.type === MovementType.ADJUST) {
      stock.quantity = Number(data.quantity);
    }
    await entityManager.save(Stock, stock);
    return movement;
  }

  async getStock(productId?: number, warehouseId?: number) {
    const where: any = {};
    if (productId) where.product_id = productId;
    if (warehouseId) where.warehouse_id = warehouseId;
    return this.stockRepo.find({ where, relations: ['product', 'warehouse'] });
  }

  async getStockMovements(productId?: number, warehouseId?: number) {
    const where: any = {};
    if (productId) where.product_id = productId;
    if (warehouseId) where.warehouse_id = warehouseId;
    return this.movementRepo.find({
      where,
      relations: ['product', 'warehouse'],
      order: { date: 'DESC' },
    });
  }

  async updateStockMovement(id: number, data: Partial<StockMovement>) {
    const movement = await this.movementRepo.findOne({ where: { id } });
    if (!movement) throw new NotFoundException('حركة المخزون غير موجودة');

    const oldQuantity = movement.quantity;
    const oldType = movement.type;

    const ds = this.movementRepo.manager.connection.createQueryRunner();
    await ds.connect();
    await ds.startTransaction();
    try {
      const movementRepo = ds.manager.getRepository(StockMovement);
      const stockRepo = ds.manager.getRepository(Stock);
      await movementRepo.update(id, data);

      if (data.quantity !== undefined || data.type !== undefined) {
        const newQty =
          data.quantity !== undefined ? data.quantity : oldQuantity;
        const newType = data.type !== undefined ? data.type : oldType;
        const stock = await stockRepo.findOne({
          where: {
            product_id: movement.product_id,
            warehouse_id: movement.warehouse_id,
          },
        });
        if (stock) {
          if (oldType === MovementType.IN)
            stock.quantity = Number(stock.quantity) - Number(oldQuantity);
          else if (oldType === MovementType.OUT)
            stock.quantity = Number(stock.quantity) + Number(oldQuantity);
          else if (oldType === MovementType.ADJUST)
            throw new BadRequestException('لا يمكن تعديل حركة تسوية مباشرة');

          if (newType === MovementType.IN)
            stock.quantity = Number(stock.quantity) + Number(newQty);
          else if (newType === MovementType.OUT) {
            if (newQty > Number(stock.quantity))
              throw new BadRequestException(
                `المخزون غير كافٍ: المتاح ${stock.quantity} والمطلوب ${newQty}`,
              );
            stock.quantity = Number(stock.quantity) - newQty;
          } else if (newType === MovementType.ADJUST)
            stock.quantity = Number(newQty);
          await stockRepo.save(stock);
        }
      }
      await ds.commitTransaction();
    } catch (err) {
      await ds.rollbackTransaction();
      throw err;
    } finally {
      await ds.release();
    }
    return this.movementRepo.findOne({
      where: { id },
      relations: ['product', 'warehouse'],
    });
  }
}
