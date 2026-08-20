import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseReturn } from '../entities/purchase-return.entity';
import { PurchaseReturnItem } from '../entities/purchase-return-item.entity';
import { Product } from '../../inventory/entities/product.entity';
import { MovementType } from '../../inventory/entities/stock-movement.entity';
import { InventoryService } from '../../inventory/inventory.service';
import { AccountingService } from '../../accounting/accounting.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PurchaseReturnService {
  constructor(
    @InjectRepository(PurchaseReturn)
    private returnRepo: Repository<PurchaseReturn>,
    @InjectRepository(PurchaseReturnItem)
    private returnItemRepo: Repository<PurchaseReturnItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private cache: CacheService,
  ) {}

  async getAllReturns() {
    return this.returnRepo.find({ relations: ['supplier'] });
  }

  async getReturn(id: number) {
    return this.returnRepo.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product'],
    });
  }

  async createReturn(data: {
    supplier_id: number;
    order_id?: number;
    total_amount: number;
    reason?: string;
    return_date?: string;
    items: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseReturn = queryRunner.manager.create(PurchaseReturn, {
        supplier_id: data.supplier_id,
        order_id: data.order_id,
        total_amount: data.total_amount,
        reason: data.reason,
        return_date: data.return_date ? new Date(data.return_date) : new Date(),
      });
      const savedReturn = await queryRunner.manager.save(
        PurchaseReturn,
        purchaseReturn,
      );

      for (const item of data.items) {
        const returnItem = queryRunner.manager.create(PurchaseReturnItem, {
          return_id: savedReturn.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
        await queryRunner.manager.save(PurchaseReturnItem, returnItem);

        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1,
            type: MovementType.OUT,
            quantity: item.quantity,
            notes: `مرتجع مشتريات - رقم ${savedReturn.id}`,
            date: savedReturn.return_date,
          },
          queryRunner.manager,
        );
      }

      await this.accountingService.postAutomaticEntry({
        type: 'PURCHASE',
        amount: -data.total_amount,
        reference: `RET-PUR-${savedReturn.id}`,
        description: `مرتجع مشتريات - رقم ${savedReturn.id}`,
      });

      await queryRunner.commitTransaction();
      await this.cache.delByPattern('reports:*');
      return savedReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
